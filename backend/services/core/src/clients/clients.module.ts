import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserDirectoryService } from './user-directory.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'IAM_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.IAM_TCP_HOST || '127.0.0.1',
          port: Number(process.env.IAM_TCP_PORT || 4101),
        },
      },
      {
        name: 'MEDIA_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.MEDIA_TCP_HOST || '127.0.0.1',
          port: Number(process.env.MEDIA_TCP_PORT || 4103),
        },
      },
    ]),
  ],
  providers: [UserDirectoryService],
  exports: [UserDirectoryService, ClientsModule],
})
export class ClientsGlobalModule {}
