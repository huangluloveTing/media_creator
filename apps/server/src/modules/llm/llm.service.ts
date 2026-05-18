import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from 'openai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { SettingsService } from '../settings/settings.service';
import { storyboardSchema, getPrepSchema, type StoryboardPayload } from './storyboard.schema';

interface CameraConfig {
  shotSize: string;
  angle: string;
  movement: string;
  duration: number;
}

const SHOT_SIZE_MAP: Record<string, string> = {
  'extreme-wide': '极远景（Extreme Wide Shot）',
  wide: '远景（Wide Shot）',
  medium: '中景（Medium Shot）',
  'close-up': '特写（Close-up）',
  'extreme-close-up': '大特写（Extreme Close-up）',
};

const ANGLE_MAP: Record<string, string> = {
  'eye-level': '平视（Eye-level）',
  low: '仰拍（Low Angle）',
  high: '俯拍（High Angle）',
  dutch: '倾斜（Dutch Angle）',
  aerial: '航拍（Aerial Shot）',
};

const MOVEMENT_MAP: Record<string, string> = {
  static: '静止镜头（Static）',
  pan: '横摇（Pan）',
  tilt: '纵摇（Tilt）',
  dolly: '推拉镜头（Dolly）',
  zoom: '变焦（Zoom）',
  handheld: '手持（Handheld）',
};

const SYSTEM_PROMPT = `你是一位顶级电影分镜师和视觉叙事专家。你的任务是根据用户的描述和镜头参数，生成**专业、富有 cinematic 质感**的分镜提示词。

## 你的核心能力

- 精确掌控镜头语言：景别、角度、运动方式
- 丰富的视觉描述：光影、色彩、构图、景深
- 专业电影术语运用：恰当地使用 cinematic terminology

## 输出要求

1. **严格遵循指定的镜头参数** — 景别、角度、运动方式是硬性约束，必须在描述中体现
2. 使用 Markdown 格式输出，包含以下结构：
   - ## 镜头描述 — 2-4 句专业级画面描述，融入光线、色彩、构图、氛围
   - ### 运镜说明 — 具体说明本镜头的景别、角度、运动方式及其叙事意图
3. 语言风格：专业、精炼、富有画面感
4. 只输出 Markdown 内容，无需前缀解释`;

const STORYBOARD_SYSTEM_PROMPT = `你是分镜规划助手。你必须严格遵循 JSON schema 输出分镜草案。
硬性约束：
1) shots 数量必须在 1..5
2) duration 必须在 1..12
3) order 必须从 0 开始连续递增
`;
const STORYBOARD_DIRECTOR_PROMPT = `你同时扮演两种角色：
1) 视频脚本专家：负责剧情目标、节奏推进、情绪弧线
2) 分镜导演：负责镜头语言、角色一致性、画面连贯

要求：
- 优先保证角色形象一致（发型、服饰、年龄感、关键外观特征）
- 如用户要求与既有角色设定冲突，先在 clarification 中指出冲突
- 先思考脚本意图，再产出镜头
`;

const PREP_CHARACTER_PROMPT = `你现在是选角导演。根据用户的描述直接生成角色形象，不需要追问。
有信息就填，没有的字段留空数组。不要提问，直接输出 JSON。

输出格式：
{ "characters": [{ "name": "", "appearance": [], "outfit": [], "traits": [], "immutable": [] }] }`;

const PREP_WORLD_SETTING_PROMPT = `你现在是世界观设计师。根据用户的描述直接生成世界观设定，不需要追问。
有信息就填，没有的字段留空。不要提问，直接输出 JSON。

输出格式：
{ "era": "", "location": "", "atmosphere": [], "rules": [], "visualStyle": "" }`;

const PREP_STORY_OUTLINE_PROMPT = `你现在是故事编剧。根据用户的描述直接生成故事梗概，不需要追问。
有信息就填，合理推断。不要提问，直接输出 JSON。

输出格式：
{ "premise": "", "plotBeats": [], "tone": "", "targetShotCount": 5 }`;

function getPrepSystemPrompt(prepType: string): string {
  switch (prepType) {
    case 'character':
      return PREP_CHARACTER_PROMPT;
    case 'world_setting':
      return PREP_WORLD_SETTING_PROMPT;
    case 'story_outline':
      return PREP_STORY_OUTLINE_PROMPT;
    default:
      return PREP_CHARACTER_PROMPT;
  }
}

function extractPrepJson(text: string): Record<string, unknown> | null {
  // Try direct JSON parse
  try {
    return JSON.parse(text);
  } catch {
    /* continue */
  }
  // Try ```json ... ``` fence
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      /* continue */
    }
  }
  // Try from first { or [
  const start = Math.min(
    text.indexOf('{') >= 0 ? text.indexOf('{') : Infinity,
    text.indexOf('[') >= 0 ? text.indexOf('[') : Infinity,
  );
  if (start < Infinity) {
    try {
      return JSON.parse(text.slice(start));
    } catch {
      /* continue */
    }
  }
  return null;
}

@Injectable()
export class LlmService {
  constructor(private readonly settings: SettingsService) {}

  // ── enhancePrompt (unchanged — no structured output needed) ──
  async enhancePrompt(prompt: string, camera?: CameraConfig): Promise<string> {
    if (!prompt.trim()) throw new BadRequestException('Prompt cannot be empty');

    const [apiKey, model, baseUrl] = await Promise.all([
      this.settings.getRaw('llm.apiKey'),
      this.settings.getRaw('llm.model'),
      this.settings.getRaw('llm.baseUrl'),
    ]);
    if (!apiKey) throw new BadRequestException('LLM not configured');

    const openai = new OpenAI({ apiKey, baseURL: baseUrl || undefined });
    let userMessage = prompt;
    if (camera) {
      userMessage = `【镜头参数】
- 景别：${SHOT_SIZE_MAP[camera.shotSize] || camera.shotSize}
- 角度：${ANGLE_MAP[camera.angle] || camera.angle}
- 运动方式：${MOVEMENT_MAP[camera.movement] || camera.movement}
- 时长：${camera.duration}秒

【原始描述】
${prompt}`;
    }

    try {
      const completion = await openai.chat.completions.create({
        model: model || 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      const result = completion.choices[0]?.message?.content?.trim();
      if (!result)
        throw new HttpException('LLM returned empty response', HttpStatus.INTERNAL_SERVER_ERROR);
      return result;
    } catch (error: any) {
      if (error instanceof HttpException || error instanceof BadRequestException) throw error;
      throw new HttpException(
        error.message || 'Failed to enhance prompt',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── draftStoryboard: generateObject with Zod schema ──
  async draftStoryboard(params: {
    instruction: string;
    baseDraft?: StoryboardPayload;
    characterProfile?: Record<string, unknown>;
    mode?: 'fast' | 'detailed';
  }): Promise<StoryboardPayload> {
    const { model, openaiProvider } = await this.getAiClient();
    const prepContext = params.characterProfile ?? null;
    const maxShots = (prepContext as any)?.storyOutline?.targetShotCount ?? 5;

    const prompt = JSON.stringify({
      instruction: params.instruction,
      prepContext,
      baseDraft: params.baseDraft ?? null,
      mode: params.mode ?? 'fast',
    });

    try {
      const { object } = await generateObject({
        model: openaiProvider(model),
        schema: storyboardSchema,
        system: `${STORYBOARD_SYSTEM_PROMPT}\n${STORYBOARD_DIRECTOR_PROMPT}`,
        prompt,
        temperature: 0.3,
      });
      return object;
    } catch (error: any) {
      if (error instanceof HttpException || error instanceof BadRequestException) throw error;
      throw new HttpException(
        error.message || 'Failed to draft storyboard',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── draftStoryboardStream: OpenAI streaming + Zod safeParse ──
  async draftStoryboardStream(
    params: {
      instruction: string;
      baseDraft?: StoryboardPayload;
      characterProfile?: Record<string, unknown>;
      mode?: 'fast' | 'detailed';
    },
    onToken: (chunk: string) => void,
  ): Promise<StoryboardPayload> {
    const { openai, model } = await this.getOpenAiClient();
    const prepContext = params.characterProfile ?? null;

    const prompt = JSON.stringify({
      task: '根据用户指令生成下一版全量分镜 JSON',
      instruction: params.instruction,
      prepContext,
      baseDraft: params.baseDraft ?? null,
      mode: params.mode ?? 'fast',
      schema: {
        version: '1.0',
        intent: 'string',
        shots: [
          {
            order: 0,
            prompt: 'string',
            shotSize: 'extreme-wide|wide|medium|close-up|extreme-close-up',
            angle: 'eye-level|low|high|dutch|aerial',
            movement: 'static|pan|tilt|dolly|zoom|handheld',
            duration: 5,
            requiredElements: ['string'],
            forbiddenElements: ['string'],
          },
        ],
      },
    });

    let fullText = '';
    try {
      const stream = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system' as const,
            content: `${STORYBOARD_SYSTEM_PROMPT}\n${STORYBOARD_DIRECTOR_PROMPT}`,
          },
          { role: 'user' as const, content: prompt },
        ],
        temperature: 0.3,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (!delta) continue;
        fullText += delta;
        onToken(delta);
      }

      const rawParsed = extractPrepJson(fullText.trim());
      if (!rawParsed)
        throw new HttpException('INVALID_LLM_FORMAT', HttpStatus.UNPROCESSABLE_ENTITY);

      // Unwrap common LLM wrapper patterns: { storyboard: {...} }, { result: {...} }
      let parsed: unknown = rawParsed;
      if (typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        if (obj.storyboard && typeof obj.storyboard === 'object') parsed = obj.storyboard;
        else if (obj.result && typeof obj.result === 'object') parsed = obj.result;
        else if (obj.data && typeof obj.data === 'object') parsed = obj.data;
      }

      const validated = storyboardSchema.safeParse(parsed);
      if (!validated.success) {
        const errors = validated.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        throw new HttpException(
          `Schema validation failed: ${errors}`,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      return validated.data;
    } catch (error: any) {
      if (error instanceof HttpException || error instanceof BadRequestException) throw error;
      throw new HttpException(
        error.message || 'Failed to draft storyboard',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── draftPrepStream: OpenAI streaming + prep Zod schema safeParse ──
  async draftPrepStream(
    params: { prepType: string; instruction: string; currentData?: Record<string, unknown> },
    onToken: (chunk: string) => void,
  ): Promise<{ text: string; extracted: Record<string, unknown> | null }> {
    const { openai, model } = await this.getOpenAiClient();
    const systemPrompt = getPrepSystemPrompt(params.prepType);
    const prompt = JSON.stringify({
      instruction: params.instruction,
      currentData: params.currentData ?? null,
    });

    let fullText = '';
    try {
      const stream = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: prompt },
        ],
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (!delta) continue;
        fullText += delta;
        onToken(delta);
      }

      const raw = extractPrepJson(fullText.trim());
      if (!raw) return { text: fullText.trim(), extracted: null };

      const schema = getPrepSchema(params.prepType);
      const validated = schema.safeParse(raw);
      if (validated.success) {
        return {
          text: fullText.trim(),
          extracted: validated.data as unknown as Record<string, unknown>,
        };
      }
      return { text: fullText.trim(), extracted: raw };
    } catch (error: any) {
      if (error instanceof HttpException || error instanceof BadRequestException) throw error;
      throw new HttpException(
        error.message || 'Failed to draft prep',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ── Clients ──
  private async getAiClient(): Promise<{
    model: string;
    openaiProvider: ReturnType<typeof createOpenAI>;
  }> {
    const [apiKey, model, baseUrl] = await Promise.all([
      this.settings.getRaw('llm.apiKey'),
      this.settings.getRaw('llm.model'),
      this.settings.getRaw('llm.baseUrl'),
    ]);
    if (!apiKey) throw new BadRequestException('LLM not configured');

    const openaiProvider = createOpenAI({
      apiKey,
      baseURL: baseUrl || 'https://api.openai.com/v1',
    });
    return { model: model || 'gpt-4o', openaiProvider };
  }

  private async getOpenAiClient(): Promise<{ openai: OpenAI; model: string }> {
    const [apiKey, model, baseUrl] = await Promise.all([
      this.settings.getRaw('llm.apiKey'),
      this.settings.getRaw('llm.model'),
      this.settings.getRaw('llm.baseUrl'),
    ]);
    if (!apiKey) throw new BadRequestException('LLM not configured');

    const openai = new OpenAI({ apiKey, baseURL: baseUrl || undefined });
    return { openai, model: model || 'gpt-4o' };
  }
}
