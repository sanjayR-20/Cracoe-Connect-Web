import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyTokenDto } from './dto/verify-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-token')
  verifyToken(@Body() dto: VerifyTokenDto) {
    return this.authService.verifyAndIssue(dto.idToken);
  }
}
