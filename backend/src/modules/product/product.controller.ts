import { Controller, Post, Body, Param } from '@nestjs/common';
import { ProductService } from './product.service';
import { SubmitProductInfoRequestDto } from './dto/submit-product-info-request.dto';
import { SubmitProductInfoResponseDto } from './dto/submit-product-info-response.dto';

/**
 * ProductController handles product information endpoints
 */
@Controller('sessions/:sessionId/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Submit product information (name and description)
   * POST /sessions/:sessionId/product
   */
  @Post()
  async submitProductInfo(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitProductInfoRequestDto,
  ): Promise<SubmitProductInfoResponseDto> {
    return this.productService.submitProductInfo(sessionId, dto);
  }
}
