import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from 'openai';
import { SettingsService } from '../settings/settings.service';

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

@Injectable()
export class LlmService {
  constructor(private readonly settings: SettingsService) {}

  async enhancePrompt(prompt: string, camera?: CameraConfig): Promise<string> {
    if (!prompt.trim()) {
      throw new BadRequestException('Prompt cannot be empty');
    }

    const [apiKey, model, baseUrl] = await Promise.all([
      this.settings.getRaw('llm.apiKey'),
      this.settings.getRaw('llm.model'),
      this.settings.getRaw('llm.baseUrl'),
    ]);

    if (!apiKey) {
      throw new BadRequestException('LLM not configured');
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
    });

    let userMessage = prompt;
    if (camera) {
      const shotLabel = SHOT_SIZE_MAP[camera.shotSize] || camera.shotSize;
      const angleLabel = ANGLE_MAP[camera.angle] || camera.angle;
      const movementLabel = MOVEMENT_MAP[camera.movement] || camera.movement;
      userMessage = `【镜头参数】
- 景别：${shotLabel}
- 角度：${angleLabel}
- 运动方式：${movementLabel}
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
      if (!result) {
        throw new HttpException('LLM returned empty response', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return result;
    } catch (error: any) {
      if (error instanceof HttpException || error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to enhance prompt',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
