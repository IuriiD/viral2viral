import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionService } from '../../common/session.service';
import { SubmitProductInfoRequestDto } from './dto/submit-product-info-request.dto';
import { SubmitProductInfoResponseDto } from './dto/submit-product-info-response.dto';
import { SessionStatus } from '../../common/types/session.types';

/**
 * ProductService handles product information submission
 */
@Injectable()
export class ProductService {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * Submit product information and store in session
   * @param sessionId - Session UUID
   * @param dto - Product information (name and description)
   * @returns Confirmation with updated session status
   */
  async submitProductInfo(
    sessionId: string,
    dto: SubmitProductInfoRequestDto,
  ): Promise<SubmitProductInfoResponseDto> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Update session with product information
    const updatedSession = this.sessionService.updateSession(sessionId, {
      productInformation: {
        productName: dto.productName,
        productDescription: dto.productDescription,
        addedAt: new Date(),
      },
      status: SessionStatus.PRODUCT_INFO_ADDED,
    });

    if (!updatedSession) {
      throw new NotFoundException(`Failed to update session ${sessionId}`);
    }

    return {
      sessionId,
      productName: dto.productName,
      productDescription: dto.productDescription,
      status: updatedSession.status,
    };
  }
}
