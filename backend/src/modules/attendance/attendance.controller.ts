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
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Record punch in/out with database persistence' })
  async recordPunch(
    @CurrentUser() user: any,
    @Body() body: { type: 'IN' | 'OUT'; location?: string; image?: string; notes?: string; userId?: string }
  ) {
    const targetUserId = body.userId || user.id;
    const record = await this.attendanceService.recordPunch(user.organizationId, targetUserId, body);
    const now = new Date();
    const delhiTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
    const delhiDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return {
      success: true,
      message: `Attendance Punch ${body.type || 'IN'} Recorded Successfully in Database`,
      type: body.type || 'IN',
      location: body.location || 'HQ Office Hub',
      image: body.image || null,
      serverTime: `${delhiDateStr} ${delhiTimeStr} IST`,
      timestamp: now.toISOString(),
      record,
    };
  }

  @Get('today')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user (or specified user) today attendance status' })
  async getTodayStatus(
    @CurrentUser() user: any,
    @Query('userId') targetUserId?: string,
  ) {
    const uid = targetUserId || user.id;
    return this.attendanceService.getTodayStatus(user.organizationId, uid);
  }

  @Post('check-in')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Employee self check-in' })
  async checkIn(@CurrentUser() user: any, @Body() body?: { location?: string; image?: string }) {
    return this.attendanceService.checkIn(user.organizationId, user.id, body?.location, body?.image);
  }

  @Post('check-out')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Employee self check-out' })
  async checkOut(@CurrentUser() user: any, @Body() body?: { location?: string; image?: string }) {
    return this.attendanceService.checkOut(user.organizationId, user.id, body?.location, body?.image);
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
    if (targetUserId && targetUserId === user.id) {
      return this.attendanceService.getAllAttendance(
        user.organizationId,
        month ? parseInt(month, 10) : undefined,
        year ? parseInt(year, 10) : undefined,
        targetUserId,
      );
    }
    if (!['ADMIN', 'SUPER_ADMIN', 'OWNER', 'HR', 'MANAGER', 'DEPT_MANAGER', 'TEAM_LEADER'].includes(role)) {
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
  @ApiOperation({ summary: 'Manually mark attendance (Admin, HR, Manager & TL)' })
  async manualMark(@CurrentUser() user: any, @Body() body: any) {
    const role = typeof user.role === 'string' ? user.role : user.role?.name || '';
    if (!['ADMIN', 'SUPER_ADMIN', 'OWNER', 'HR', 'MANAGER', 'DEPT_MANAGER', 'TEAM_LEADER'].includes(role)) {
      throw new ForbiddenException('⛔ Access Denied: Only Admins, HR, Managers, and Team Leaders can manually mark attendance.');
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
