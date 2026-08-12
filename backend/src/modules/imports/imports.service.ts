import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ImportsService {
  constructor(private prisma: PrismaService) {}
}
