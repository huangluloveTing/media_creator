import { Controller, Post, Body, BadRequestException, Res } from '@nestjs/common';
import { LlmService } from './llm.service';
import { StoryboardService } from './storyboard.service';
import type { StoryboardPayload } from './storyboard.schema';
import type { Response } from 'express';

interface EnhancePromptBody {
  prompt: string;
  shotSize?: string;
  angle?: string;
  movement?: string;
  duration?: number;
}

interface DraftStoryboardBody {
  projectId: string;
  instruction: string;
  baseDraft?: StoryboardPayload;
  mode?: 'fast' | 'detailed';
}

@Controller('llm')
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    private readonly storyboardService: StoryboardService,
  ) {}

  @Post('enhance-prompt')
  async enhancePrompt(@Body() body: EnhancePromptBody) {
    if (!body.prompt || !body.prompt.trim()) {
      throw new BadRequestException('Prompt cannot be empty');
    }
    const camera =
      body.shotSize || body.angle || body.movement
        ? {
            shotSize: body.shotSize ?? '',
            angle: body.angle ?? '',
            movement: body.movement ?? '',
            duration: body.duration ?? 5,
          }
        : undefined;
    const result = await this.llmService.enhancePrompt(body.prompt, camera);
    return { result };
  }

  @Post('storyboard/draft')
  async draftStoryboard(@Body() body: DraftStoryboardBody) {
    if (!body.projectId) throw new BadRequestException('projectId is required');
    return this.storyboardService.createDraft({
      projectId: body.projectId,
      instruction: body.instruction,
      baseDraft: body.baseDraft,
      mode: body.mode,
    });
  }

  @Post('storyboard/draft/stream')
  async draftStoryboardStream(@Body() body: DraftStoryboardBody, @Res() res: Response) {
    if (!body.projectId) throw new BadRequestException('projectId is required');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      send('progress', { stage: 'validating' });
      if (isInstructionInsufficient(body.instruction)) {
        send('clarification', {
          question: '请补充角色/风格/节奏中的至少一项，以便更精准生成分镜。',
        });
      }
      send('progress', { stage: 'generating' });
      const result = await this.storyboardService.createDraftStream(
        {
          projectId: body.projectId,
          instruction: body.instruction,
          baseDraft: body.baseDraft,
          mode: body.mode,
        },
        (chunk) => send('token', { chunk }),
      );
      if (result.characterProfile) {
        send('constraint-summary', { characterProfile: result.characterProfile });
      }
      send('progress', { stage: 'persisting' });
      send('done', result);
      res.end();
    } catch (error: any) {
      send('error', { message: error?.message ?? 'draft failed' });
      res.end();
    }
  }
}

function isInstructionInsufficient(text: string): boolean {
  const t = (text || '').trim();
  if (!t) return true;
  const hasRole = /(男|女|角色|人物|主角|hero|character)/i.test(t);
  const hasStyle = /(风格|写实|动漫|电影感|style|cinematic)/i.test(t);
  const hasPace = /(节奏|快|慢|紧张|pacing|rhythm)/i.test(t);
  return !(hasRole || hasStyle || hasPace);
}
