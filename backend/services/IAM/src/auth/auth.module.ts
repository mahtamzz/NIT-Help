import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({}),
    ClientsModule.register([
      {
        name: 'CORE_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.CORE_TCP_HOST || '127.0.0.1',
          port: Number(process.env.CORE_TCP_PORT || 4102),
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
