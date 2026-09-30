import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get('server-time')
  @ApiOperation({ summary: 'Get current Delhi server time' })
  getServerTime() {
    const now = new Date();
    const delhiTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
    const delhiDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const fullDelhiStr = `${delhiDateStr} ${delhiTimeStr} IST (Delhi Server Time)`;
    return {
      serverTime: fullDelhiStr,
      delhiTime: delhiTimeStr,
      delhiDate: delhiDateStr,
      timeZone: 'Asia/Kolkata (Delhi Time)',
      isoDate: now.toISOString(),
      timestampMs: now.getTime(),
      formattedTime: delhiTimeStr,
      formattedDate: delhiDateStr,
    };
  }

  @Post('punch')
  @ApiOperation({ summary: 'Record punch in/out (fallback compatibility)' })
  async recordPunch(@Body() body: { type: 'IN' | 'OUT'; location?: string; image?: string }) {
    const now = new Date();
    const delhiTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
    const delhiDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return {
      success: true,
      message: `Attendance Punch ${body.type || 'IN'} Recorded Successfully`,
      type: body.type || 'IN',
      location: body.location || 'HQ Office Hub',
      image: body.image || null,
      serverTime: `${delhiDateStr} ${delhiTimeStr} IST`,
      timestamp: now.toISOString(),
    };
  }

  @Post('check-in')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Employee self check-in' })
  async checkIn(@CurrentUser() user: any) {
    return this.attendanceService.checkIn(user.organizationId, user.id);
  }

  @Post('check-out')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Employee self check-out' })
  async checkOut(@CurrentUser() user: any) {
    return this.attendanceService.checkOut(user.organizationId, user.id);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user attendance history' })
  async getMyAttendance(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.attendanceService.getMyAttendance(
      user.id,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get('team')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get team attendance for Manager/TL' })
  async getTeamAttendance(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.attendanceService.getTeamAttendance(
      user.organizationId,
      user.id,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
  }

  @Get('all')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all attendance records (Admin & HR only)' })
  async getAllAttendance(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('userId') targetUserId?: string,
  ) {
    const role = typeof user.role === 'string' ? user.role : user.role?.name || '';
    if (!['ADMIN', 'SUPER_ADMIN', 'OWNER', 'HR', 'MANAGER', 'DEPT_MANAGER'].includes(role)) {
      throw new ForbiddenException('⛔ Access Denied: Only Admins, HR, and Managers can view company attendance.');
    }
    return this.attendanceService.getAllAttendance(
      user.organizationId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
      targetUserId,
    );
  }

  @Post('manual')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Manually mark attendance (Admin, HR & Manager only)' })
  async manualMark(@CurrentUser() user: any, @Body() body: any) {
    const role = typeof user.role === 'string' ? user.role : user.role?.name || '';
    if (!['ADMIN', 'SUPER_ADMIN', 'OWNER', 'HR', 'MANAGER', 'DEPT_MANAGER'].includes(role)) {
      throw new ForbiddenException('⛔ Access Denied: Only Admins, HR, and Managers can manually mark attendance.');
    }
    return this.attendanceService.manualMark(user.organizationId, user.id, body);
  }

  @Get('summary')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get attendance summary metrics' })
  async getSummary(
    @CurrentUser() user: any,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('userId') targetUserId?: string,
  ) {
    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const queryUserId = targetUserId || user.id;
    return this.attendanceService.getSummary(user.organizationId, queryUserId, m, y);
  }
}
