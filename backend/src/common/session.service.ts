/**
 * SessionService
 *
 * In-memory session storage and management using singleton pattern.
 * Holds all workflow state without database persistence (POC requirement).
 */

import { Injectable, Scope } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Session, SessionStatus } from './types/session.types';

/**
 * SessionService manages in-memory session state for all workflows
 * Singleton provider with application scope
 */
@Injectable({ scope: Scope.DEFAULT })
export class SessionService {
  /** Instance counter for debugging */
  private static instanceCounter = 0;
  private readonly instanceId: number;

  /** In-memory session storage */
  private readonly sessions: Map<string, Session> = new Map();

  /** Session TTL in milliseconds (24 hours) */
  private readonly SESSION_TTL = 24 * 60 * 60 * 1000;

  constructor() {
    this.instanceId = ++SessionService.instanceCounter;
    console.log(`[SessionService] Instance #${this.instanceId} created`);
  }

  /**
   * Create a new session
   * @returns Newly created session
   */
  createSession(): Session {
    const sessionId = uuidv4();
    const now = new Date();

    const session: Session = {
      sessionId,
      createdAt: now,
      lastActivityAt: now,
      status: SessionStatus.CREATED,
    };

    this.sessions.set(sessionId, session);
    console.log(
      `[SessionService #${this.instanceId}] Created session ${sessionId}, total sessions: ${this.sessions.size}`,
    );
    return session;
  }

  /**
   * Get session by ID
   * @param sessionId - Session UUID
   * @returns Session or undefined if not found
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    console.log(
      `[SessionService #${this.instanceId}] Getting session ${sessionId}, found: ${!!session}, total sessions: ${this.sessions.size}`,
    );
    return session;
  }

  /**
   * Update session data
   * @param sessionId - Session UUID
   * @param updates - Partial session updates
   * @returns Updated session or undefined if not found
   */
  updateSession(
    sessionId: string,
    updates: Partial<Omit<Session, 'sessionId' | 'createdAt'>>,
  ): Session | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }

    const updatedSession: Session = {
      ...session,
      ...updates,
      lastActivityAt: new Date(),
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  /**
   * Update session status
   * @param sessionId - Session UUID
   * @param status - New session status
   * @returns Updated session or undefined if not found
   */
  updateSessionStatus(
    sessionId: string,
    status: SessionStatus,
  ): Session | undefined {
    return this.updateSession(sessionId, { status });
  }

  /**
   * Delete session
   * @param sessionId - Session UUID
   * @returns True if deleted, false if not found
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all sessions (for debugging/admin purposes)
   * @returns Array of all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clean up expired sessions (sessions older than TTL)
   * Should be called periodically by a scheduled task
   * @returns Number of sessions cleaned up
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.lastActivityAt.getTime();
      if (age > this.SESSION_TTL) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get session count
   * @returns Number of active sessions
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}
