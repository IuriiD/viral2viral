/**
 * SessionsController
 *
 * REST endpoints for session management.
 */

import { Controller, Post, Get, Param } from '@nestjs/common';
import { SessionService } from '../../common/session.service';
import { Session } from '../../common/types/session.types';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * Create a new session
   * POST /sessions
   */
  @Post()
  createSession(): { sessionId: string; session: Session } {
    const session = this.sessionService.createSession();
    console.log('Session created:', session.sessionId);
    return {
      sessionId: session.sessionId,
      session,
    };
  }

  /**
   * Get session by ID
   * GET /sessions/:sessionId
   */
  @Get(':sessionId')
  getSession(@Param('sessionId') sessionId: string): Session | null {
    const session = this.sessionService.getSession(sessionId);
    return session || null;
  }
}
