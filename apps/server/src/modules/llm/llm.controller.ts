import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { LlmService } from './llm.service';

interface EnhancePromptBody {
  prompt: string;
  shotSize?: string;
  angle?: string;
  movement?: string;
  duration?: number;
}

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

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
}
