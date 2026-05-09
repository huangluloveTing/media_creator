import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Edge } from '../shot/entities/edge.entity';
import { Shot } from '../shot/entities/shot.entity';

export interface MergeConfig {
  shots: Shot[];
  edges: Edge[];
  bgmPath?: string;
  bgmVolume: number;
  originalVolume: number;
  outputPath: string;
  resolution: string;
  fps: number;
}

@Injectable()
export class FFmpegService {
  private readonly logger = new Logger(FFmpegService.name);

  async merge(config: MergeConfig): Promise<string> {
    const { shots, edges, bgmPath, bgmVolume, originalVolume, outputPath, resolution, fps } =
      config;

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Validate all shot files exist
    for (const shot of shots) {
      const localPath = shot.generationTask?.localPath;
      if (!localPath) {
        throw new Error(`Shot ${shot.id} (order ${shot.order}) has no local video file`);
      }
      try {
        await fs.access(localPath);
      } catch {
        throw new Error(`Video file not found for shot ${shot.id}: ${localPath}`);
      }
    }

    const [width, height] = resolution.split('x').map(Number);
    const args = this.buildFilterComplex(shots, edges, bgmPath, bgmVolume, originalVolume);

    const cmdArgs = [
      ...this.buildInputArgs(shots, bgmPath),
      ...args,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '18',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-r', String(fps),
      '-s', resolution,
      '-map', '[vout]',
      '-map', '[aout]',
      '-y',
      outputPath,
    ];

    this.logger.log(`FFmpeg merge: ${shots.length} clips → ${outputPath}`);

    return new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', cmdArgs);

      let stderr = '';
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.logger.log(`FFmpeg merge complete: ${outputPath}`);
          resolve(outputPath);
        } else {
          this.logger.error(`FFmpeg failed (code ${code}): ${stderr.slice(-500)}`);
          reject(new Error(`FFmpeg merge failed: ${stderr.slice(-300)}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`FFmpeg spawn error: ${err.message}`));
      });
    });
  }

  async extractLastFrame(videoPath: string, outputPath: string): Promise<string> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', [
        '-sseof', '-1',
        '-i', videoPath,
        '-vframes', '1',
        '-q:v', '2',
        '-y',
        outputPath,
      ]);
      proc.on('close', (code) => {
        code === 0 ? resolve(outputPath) : reject(new Error(`Last frame extraction failed`));
      });
      proc.stderr.on('data', () => {});
    });
  }

  async validatePrerequisites(shots: Shot[]): Promise<string[]> {
    const issues: string[] = [];
    for (const shot of shots) {
      if (!shot.generationTask || shot.generationTask.status !== 'completed') {
        issues.push(`Shot order ${shot.order}: not completed (status: ${shot.generationTask?.status ?? 'none'})`);
      }
    }
    return issues;
  }

  // -- Private helpers --

  private buildInputArgs(shots: Shot[], bgmPath?: string): string[] {
    const args: string[] = [];
    for (const shot of shots) {
      args.push('-i', shot.generationTask!.localPath!);
    }
    if (bgmPath) {
      args.push('-stream_loop', '-1', '-i', bgmPath);
    }
    return args;
  }

  private buildFilterComplex(
    shots: Shot[],
    edges: Edge[],
    bgmPath?: string,
    bgmVolume = 0.3,
    originalVolume = 1.0,
  ): string[] {
    const filters: string[] = [];

    if (shots.length === 1) {
      // Single clip: just copy
      filters.push(`[0:v]setpts=PTS-STARTPTS[vout]`);
      filters.push(`[0:a]volume=${originalVolume}[aout]`);
      return ['-filter_complex', filters.join(';')];
    }

    // Build xfade chain for multiple clips
    let prevLabel = '0:v';
    let cumulativeOffset = 0;

    for (let i = 0; i < shots.length - 1; i++) {
      const edge = edges[i + 1]; // edges[0] is Start→Shot1, edges[1] is Shot1→Shot2
      const transType = edge?.transitionType ?? 'dissolve';
      const transDuration = edge?.transitionDuration ?? 0.5;
      const nextLabel = i === shots.length - 2 ? 'vout' : `v${i + 1}`;

      // xfade offset: time in the first input at which the transition starts.
      // Each transition shifts the timeline by (shotDuration - transitionDuration),
      // so we accumulate both across the chain.
      cumulativeOffset += (shots[i]?.duration ?? 5);
      cumulativeOffset -= transDuration;

      const xfade = this.buildXfade(
        prevLabel,
        `${i + 1}:v`,
        nextLabel,
        transType,
        transDuration,
        cumulativeOffset,
      );
      filters.push(xfade);
      prevLabel = nextLabel;
    }

    // Audio: mix all audio tracks + optional BGM
    const audioInputs: string[] = [];
    for (let i = 0; i < shots.length; i++) {
      audioInputs.push(`[${i}:a]`);
    }

    if (bgmPath) {
      const bgmIdx = shots.length;
      filters.push(
        `[${bgmIdx}:a]volume=${bgmVolume},atrim=0:99999[bgm]`,
      );

      // Mix all original audio
      if (audioInputs.length === 1) {
        filters.push(
          `${audioInputs[0]}volume=${originalVolume}[orig]`,
        );
      } else {
        const audioMixes = audioInputs.map((a, i) => `${a}volume=${originalVolume}[a${i}]`).join(';');
        filters.push(audioMixes);
        const joined = audioInputs.map((_, i) => `[a${i}]`).join('');
        filters.push(`${joined}amix=inputs=${audioInputs.length}:duration=longest[orig]`);
      }

      filters.push(`[orig][bgm]amix=inputs=2:duration=first:weights=1 1[aout]`);
    } else {
      if (audioInputs.length === 1) {
        filters.push(`${audioInputs[0]}volume=${originalVolume}[aout]`);
      } else {
        const audioMixes = audioInputs.map((a, i) => `${a}volume=${originalVolume}[a${i}]`).join(';');
        filters.push(audioMixes);
        const joined = audioInputs.map((_, i) => `[a${i}]`).join('');
        filters.push(`${joined}amix=inputs=${audioInputs.length}:duration=longest[aout]`);
      }
    }

    return ['-filter_complex', filters.join(';')];
  }

  private buildXfade(
    srcLabel: string,
    dstLabel: string,
    outLabel: string,
    type: string,
    duration: number,
    offset: number,
  ): string {
    if (type === 'cut' || type === 'none' || duration <= 0) {
      return `[${srcLabel}][${dstLabel}]concat=n=2:v=1:a=0[${outLabel}]`;
    }

    const xfadeMap: Record<string, string> = {
      'dissolve': 'dissolve',
      'fade': 'fadeblack',
      'wipe': 'wipeleft',
    };

    const xfadeType = xfadeMap[type] ?? 'dissolve';

    return `[${srcLabel}][${dstLabel}]xfade=transition=${xfadeType}:duration=${duration}:offset=${offset}[${outLabel}]`;
  }
}
