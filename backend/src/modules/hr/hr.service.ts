import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class HrService { constructor(private prisma: PrismaService) {} }
