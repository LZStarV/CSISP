#!/usr/bin/env ts-node

import { Sequelize, DataTypes, Model } from 'sequelize';
import * as bcrypt from 'bcrypt';
import {
  Status,
  WeekDay,
  Timestamp,
  User as UserType,
  Teacher as TeacherType,
  Class as ClassType,
  Course as CourseType,
  TimeSlot as TimeSlotType,
  SubCourse as SubCourseType,
  UserCreationAttributes,
  Role as RoleType,
  RoleCreationAttributes,
  CourseTeacherAttributes,
  UserRoleAttributes,
  UserClassAttributes,
  AttendanceTask as AttendanceTaskType,
  AttendanceRecord as AttendanceRecordType,
  CreateCourseInput,
  CreateTeacherInput,
  CreateClassInput,
  CreateTimeSlotInput,
  CreateAttendanceTaskInput,
  CreateAttendanceRecordInput,
  CreateSubCourseInput,
  AttendanceStatus,
} from '@csisp/types';
import {
  COURSE_DATA,
  TEACHERS,
  FIRST_NAMES,
  MALE_NAMES,
  FEMALE_NAMES,
  MAJORS,
} from './seed_data_sources.js';

type UserAttributes = UserType;
type RoleAttributes = RoleType;
type CourseAttributes = CourseType;
type TeacherAttributes = TeacherType;
type ClassAttributes = ClassType;
type TimeSlotAttributes = TimeSlotType;
type SubCourseAttributes = SubCourseType;
type AttendanceTaskAttributes = AttendanceTaskType;
type AttendanceRecordAttributes = AttendanceRecordType;

type CourseCreationAttributes = CreateCourseInput;
type TeacherCreationAttributes = CreateTeacherInput;
type ClassCreationAttributes = CreateClassInput;
type TimeSlotCreationAttributes = CreateTimeSlotInput;
type SubCourseCreationAttributes = CreateSubCourseInput;
type AttendanceTaskCreationAttributes = CreateAttendanceTaskInput;
type AttendanceRecordCreationAttributes = CreateAttendanceRecordInput;

// 模型定义
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public realName!: string;
  public studentId!: string;
  public enrollmentYear!: number;
  public major!: string;
  public status!: Status;
  public createdAt!: Timestamp;
  public updatedAt!: Timestamp;
}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description!: string;
  public status!: Status;
  public createdAt!: Timestamp;
  public updatedAt!: Timestamp;

  // 关联方法
  public getUsers!: () => Promise<User[]>;
}

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: number;
  public courseName!: string;
  public courseCode!: string;
  public semester!: number;
  public academicYear!: number;
  public availableMajors!: string[];
  public status!: Status;
  public createdAt!: Timestamp;
  public updatedAt!: Timestamp;

  // 关联方法
  public getTeachers!: () => Promise<Teacher[]>;
  public getClasses!: () => Promise<Class[]>;
}

class Teacher
  extends Model<TeacherAttributes, TeacherCreationAttributes>
  implements TeacherAttributes
{
  public id!: number;
  public userId!: number;
  public realName!: string;
  public email!: string;
  public teacherId!: string;
  public department!: string;
  public title!: string;
  public status!: Status;
  public createdAt!: Timestamp;
  public updatedAt!: Timestamp;
  public phone!: string;

  // 关联方法
  public getCourses!: () => Promise<Course[]>;
}

class Class extends Model<ClassAttributes, ClassCreationAttributes> implements ClassAttributes {
  public id!: number;
  public className!: string;
  public courseId!: number;
  public teacherId!: number;
  public semester!: number;
  public academicYear!: number;
  public maxStudents!: number; // 最大学生数
  public status!: Status;
  public createdAt!: Timestamp;
  public updatedAt!: Timestamp;

  // 关联方法
  public getCourse!: () => Promise<Course>;
  public getUsers!: () => Promise<User[]>;
}

class TimeSlot
  extends Model<TimeSlotAttributes, TimeSlotCreationAttributes>
  implements TimeSlotAttributes
{
  public id!: number;
  public subCourseId!: number;
  public startTime!: string;
  public endTime!: string;
  public weekday!: WeekDay;
  public location!: string;
  public status!: Status;
  public createdAt!: Timestamp;
  public updatedAt!: Timestamp;

  // 关联方法
  public getCourse!: () => Promise<Course>;
}

class AttendanceTask
  extends Model<AttendanceTaskAttributes, AttendanceTaskCreationAttributes>
  implements AttendanceTaskAttributes
{
  public id!: number;
  public classId!: number; // 根据文档应该是classId而不是courseId
  public taskName!: string; // 任务名称
  public taskType!: string; // 任务类型
  public startTime!: Timestamp;
  public endTime!: Timestamp;
  public status!: Status;
  public createdAt!: Timestamp;
  public updatedAt!: Timestamp;

  // 关联方法
  public getClass!: () => Promise<Class>; // 修改为获取班级的方法
  public getAttendanceRecords!: () => Promise<AttendanceRecord[]>;
}

class AttendanceRecord
  extends Model<AttendanceRecordAttributes, AttendanceRecordCreationAttributes>
  implements AttendanceRecordAttributes
{
  public id!: number;
  public attendanceTaskId!: number; // 根据文档应该是attendanceTaskId
  public userId!: number; // 根据文档应该是userId
  public status!: AttendanceStatus; // 考勤状态
  public remark!: string; // 备注
  public createdAt!: Timestamp;
  public updatedAt!: Timestamp;

  // 关联方法
  public getAttendanceTask!: () => Promise<AttendanceTask>;
  public getUser!: () => Promise<User>;
}

class UserRole extends Model<UserRoleAttributes, UserRoleAttributes> implements UserRoleAttributes {
  public userId!: number;
  public roleId!: number;
}

class CourseTeacher
  extends Model<CourseTeacherAttributes, CourseTeacherAttributes>
  implements CourseTeacherAttributes
{
  public courseId!: number;
  public teacherId!: number;
}

class UserClass
  extends Model<UserClassAttributes, UserClassAttributes>
  implements UserClassAttributes
{
  public userId!: number;
  public classId!: number;
}

class SubCourse
  extends Model<SubCourseAttributes, SubCourseCreationAttributes>
  implements SubCourseAttributes
{
  public id!: number;
  public courseId!: number;
  public subCourseCode!: string;
  public teacherId!: number;
  public academicYear!: number;
  public status!: Status;
  public createdAt!: Timestamp;
  public updatedAt!: Timestamp;
}

// 数据库连接
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'csisp',
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  logging: console.log,
});

// 初始化模型
User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    realName: { type: DataTypes.STRING(255), field: 'real_name', allowNull: false },
    studentId: { type: DataTypes.STRING(11), field: 'student_id', allowNull: false, unique: true },
    enrollmentYear: {
      type: DataTypes.INTEGER,
      field: 'enrollment_year',
      allowNull: false,
      validate: { min: 2022, max: 2025 },
    },
    major: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.INTEGER, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    sequelize,
  }
);

Role.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.INTEGER, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    sequelize,
  }
);

Course.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    courseName: { type: DataTypes.STRING(255), field: 'course_name', allowNull: false },
    courseCode: {
      type: DataTypes.STRING(50),
      field: 'course_code',
      allowNull: false,
      unique: true,
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 8 },
    },
    academicYear: { type: DataTypes.INTEGER, field: 'academic_year', allowNull: false },
    availableMajors: { type: DataTypes.JSON, field: 'available_majors', allowNull: false },
    status: { type: DataTypes.INTEGER, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    tableName: 'courses',
    sequelize,
  }
);

Teacher.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, field: 'user_id', allowNull: false },
    realName: { type: DataTypes.STRING(255), field: 'real_name', allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    teacherId: { type: DataTypes.STRING(11), field: 'teacher_id', allowNull: false, unique: true },
    department: { type: DataTypes.STRING(255), allowNull: false },
    title: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '讲师' },
    status: { type: DataTypes.INTEGER, defaultValue: 1 },
    phone: { type: DataTypes.STRING(20) },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    tableName: 'teachers',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    sequelize,
  }
);

Class.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    className: { type: DataTypes.STRING(255), field: 'class_name', allowNull: false },
    courseId: { type: DataTypes.INTEGER, field: 'course_id', allowNull: false },
    teacherId: { type: DataTypes.INTEGER, field: 'teacher_id', allowNull: false },
    semester: { type: DataTypes.INTEGER, allowNull: false },
    academicYear: { type: DataTypes.INTEGER, field: 'academic_year', allowNull: false },
    maxStudents: { type: DataTypes.INTEGER, field: 'max_students', defaultValue: 50 },
    status: { type: DataTypes.INTEGER, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    tableName: 'classes',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    sequelize,
  }
);

TimeSlot.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    subCourseId: { type: DataTypes.INTEGER, field: 'sub_course_id', allowNull: false },
    weekday: { type: DataTypes.INTEGER, field: 'weekday', allowNull: false },
    startTime: { type: DataTypes.TIME, field: 'start_time', allowNull: false },
    endTime: { type: DataTypes.TIME, field: 'end_time', allowNull: false },
    location: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.INTEGER, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    tableName: 'time_slots',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    sequelize,
  }
);

AttendanceTask.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    classId: { type: DataTypes.INTEGER, field: 'class_id', allowNull: false },
    taskName: { type: DataTypes.STRING(255), field: 'task_name', allowNull: false },
    taskType: { type: DataTypes.STRING(50), field: 'task_type', allowNull: false },
    startTime: { type: DataTypes.DATE, field: 'start_time', allowNull: false },
    endTime: { type: DataTypes.DATE, field: 'end_time', allowNull: false },
    status: { type: DataTypes.INTEGER, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    tableName: 'attendance_tasks',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    sequelize,
  }
);

AttendanceRecord.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    attendanceTaskId: { type: DataTypes.INTEGER, field: 'attendance_task_id', allowNull: false },
    userId: { type: DataTypes.INTEGER, field: 'user_id', allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false },
    remark: { type: DataTypes.TEXT },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    tableName: 'attendance_records',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    sequelize,
  }
);

UserRole.init(
  {
    userId: { type: DataTypes.INTEGER, field: 'user_id', primaryKey: true },
    roleId: { type: DataTypes.INTEGER, field: 'role_id', primaryKey: true },
  },
  {
    tableName: 'user_roles',
    timestamps: false,
    sequelize,
  }
);

CourseTeacher.init(
  {
    courseId: { type: DataTypes.INTEGER, field: 'course_id', primaryKey: true },
    teacherId: { type: DataTypes.INTEGER, field: 'teacher_id', primaryKey: true },
  },
  {
    tableName: 'course_teachers',
    timestamps: false,
    sequelize,
  }
);

UserClass.init(
  {
    userId: { type: DataTypes.INTEGER, field: 'user_id', primaryKey: true },
    classId: { type: DataTypes.INTEGER, field: 'class_id', primaryKey: true },
  },
  {
    tableName: 'user_classes',
    timestamps: false,
    sequelize,
  }
);

SubCourse.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    courseId: { type: DataTypes.INTEGER, field: 'course_id', allowNull: false },
    subCourseCode: {
      type: DataTypes.STRING(50),
      field: 'sub_course_code',
      allowNull: false,
      unique: true,
    },
    teacherId: { type: DataTypes.INTEGER, field: 'teacher_id', allowNull: false },
    academicYear: { type: DataTypes.INTEGER, field: 'academic_year', allowNull: false },
    status: { type: DataTypes.INTEGER, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  },
  {
    tableName: 'sub_courses',
    sequelize,
  }
);

// 工具函数
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomSubarray<T>(arr: T[], size: number): T[] {
  if (size >= arr.length) return arr;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function generateChineseName(): string {
  const familyName = getRandomElement(FIRST_NAMES);
  const isMale = Math.random() > 0.5;
  const givenNameLength = Math.random() > 0.3 ? 2 : 1;
  let givenName = '';

  if (givenNameLength === 1) {
    givenName = isMale ? getRandomElement(MALE_NAMES) : getRandomElement(FEMALE_NAMES);
  } else {
    givenName = isMale
      ? getRandomElement(MALE_NAMES) + getRandomElement(MALE_NAMES)
      : getRandomElement(FEMALE_NAMES) + getRandomElement(FEMALE_NAMES);
  }

  return familyName + givenName;
}

// 主函数
async function generateSeedData(): Promise<void> {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 定义模型关联
    User.hasMany(UserRole, { foreignKey: 'userId' });
    Role.hasMany(UserRole, { foreignKey: 'roleId' });
    UserRole.belongsTo(User, { foreignKey: 'userId' });
    UserRole.belongsTo(Role, { foreignKey: 'roleId' });

    Course.hasMany(Class, { foreignKey: 'courseId', as: 'classes' });
    Class.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

    Teacher.hasMany(Class, { foreignKey: 'teacherId', as: 'classes' });
    Class.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

    Course.hasMany(SubCourse, { foreignKey: 'courseId', as: 'subCourses' });
    SubCourse.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

    Teacher.hasMany(SubCourse, { foreignKey: 'teacherId', as: 'subCourses' });
    SubCourse.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

    SubCourse.hasMany(TimeSlot, { foreignKey: 'subCourseId', as: 'timeSlots' });
    TimeSlot.belongsTo(SubCourse, { foreignKey: 'subCourseId', as: 'subCourse' });

    Class.hasMany(AttendanceTask, { foreignKey: 'classId', as: 'attendanceTasks' });
    AttendanceTask.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

    AttendanceTask.hasMany(AttendanceRecord, { foreignKey: 'attendanceTaskId' });
    AttendanceRecord.belongsTo(AttendanceTask, { foreignKey: 'attendanceTaskId' });

    User.hasMany(AttendanceRecord, { foreignKey: 'userId' });
    AttendanceRecord.belongsTo(User, { foreignKey: 'userId' });

    User.hasMany(UserClass, { foreignKey: 'userId' });
    Class.hasMany(UserClass, { foreignKey: 'classId' });
    UserClass.belongsTo(User, { foreignKey: 'userId' });
    UserClass.belongsTo(Class, { foreignKey: 'classId' });

    Course.hasMany(CourseTeacher, { foreignKey: 'courseId' });
    Teacher.hasMany(CourseTeacher, { foreignKey: 'teacherId' });
    CourseTeacher.belongsTo(Course, { foreignKey: 'courseId' });
    CourseTeacher.belongsTo(Teacher, { foreignKey: 'teacherId' });

    // 创建数据库表
    await sequelize.sync({ force: true });
    console.log('数据库表创建完成');

    // 创建角色
    const [adminRole, studentRole, teacherRole] = await Role.bulkCreate([
      { name: 'admin', code: 'admin', description: '管理员', status: Status.Active },
      { name: 'student', code: 'student', description: '学生', status: Status.Active },
      { name: 'teacher', code: 'teacher', description: '教师', status: Status.Active },
    ] as unknown as RoleCreationAttributes[]);
    console.log('角色创建成功');

    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      studentId: '20232131082',
      enrollmentYear: 2023,
      major: '计算机科学与技术',
      status: Status.Active,
    } as UserCreationAttributes);

    // 关联管理员角色
    await UserRole.create({ userId: adminUser.dataValues.id, roleId: adminRole.dataValues.id });
    console.log('管理员用户创建成功');

    // 管理员用户已创建完成

    // 创建教师用户
    const teachers = await Promise.all(
      TEACHERS.map(async (teacher, index) => {
        const hashedPassword = await bcrypt.hash('teacher123', 10);
        const user = await User.create({
          username: `teacher${index + 1}`,
          password: hashedPassword,
          realName: teacher.realName,
          studentId: Math.floor(10000000000 + Math.random() * 9000000000).toString(),
          enrollmentYear: 2023,
          major: '计算机科学',
          status: Status.Active,
        } as UserCreationAttributes);

        await Teacher.create({
          userId: user.dataValues.id,
          realName: teacher.realName,
          email: teacher.email,
          teacherId: Math.floor(10000000000 + Math.random() * 9000000000).toString(),
          department: teacher.department,
          title: getRandomElement(['讲师', '副教授', '教授']),
          status: Status.Active,
          phone: `138${Math.floor(Math.random() * 100000000)
            .toString()
            .padStart(8, '0')}`,
        } as TeacherCreationAttributes);

        // 关联教师角色
        await UserRole.create({ userId: user.dataValues.id, roleId: teacherRole.dataValues.id });

        return user;
      })
    );

    console.log('教师用户创建成功');

    // 创建课程
    const currentYear = new Date().getFullYear();
    const coursesAndClasses = await Promise.all(
      COURSE_DATA.map(async (courseData, index) => {
        let academicYear = currentYear;
        const semesterNum = Number(courseData.semester);
        if (semesterNum === 1 || semesterNum === 2) {
          academicYear = currentYear;
        } else if (semesterNum === 3 || semesterNum === 4) {
          academicYear = currentYear - 1;
        } else if (semesterNum === 5 || semesterNum === 6) {
          academicYear = currentYear - 2;
        } else {
          academicYear = currentYear - 3;
        }

        const course = await Course.create({
          courseName: courseData.name,
          courseCode: courseData.code,
          semester: Number(courseData.semester.split('-')[1]), // 从'2025-1'中提取学期数字
          academicYear: courseData.academicYear || academicYear,
          availableMajors: courseData.availableMajors,
          status: Status.Active,
        } as CourseCreationAttributes);

        // 分配教师
        const availableTeachers = await Teacher.findAll();

        let selectedTeacher = getRandomElement(availableTeachers);
        if (availableTeachers.length > 0) {
          selectedTeacher = getRandomElement(availableTeachers);
          await CourseTeacher.create({
            courseId: course.dataValues.id,
            teacherId: selectedTeacher.dataValues.id,
          });
        }

        const subCourse = await SubCourse.create({
          courseId: course.dataValues.id,
          subCourseCode: `${course.dataValues.courseCode}-S1`,
          teacherId: selectedTeacher.dataValues.id,
          academicYear: course.dataValues.academicYear,
          status: Status.Active,
        } as CreateSubCourseInput);

        // 创建班级
        const className = `${course.dataValues.courseName}-${getRandomInt(1, 5)}班`;
        const classInstance = await Class.create({
          courseId: course.dataValues.id,
          className,
          teacherId: selectedTeacher.dataValues.id,
          semester: course.dataValues.semester,
          academicYear: course.dataValues.academicYear,
          maxStudents: getRandomInt(30, 60),
          status: Status.Active,
        } as ClassCreationAttributes);

        return { course, classInstance, teacher: selectedTeacher, subCourse };
      })
    );

    const courses = coursesAndClasses.map(item => item.course);
    const classes = coursesAndClasses.map(item => item.classInstance);
    const subCourses = coursesAndClasses.map(item => item.subCourse);

    console.log('课程和班级创建完成');

    // 创建时间槽
    const timeSlotPromises = subCourses.map(async subCourse => {
      const weekDays = [1, 2, 3, 4, 5]; // 使用数字表示星期几，而不是WeekDay枚举值
      const startTimes = ['08:00', '09:50', '14:00', '15:50', '19:00'];
      const endTimes = ['09:40', '11:30', '15:40', '17:30', '20:40'];
      const locations = ['A101', 'A102', 'B201', 'B202', 'C301', 'C302'];

      const weekDay = getRandomElement(weekDays);
      const timeIndex = getRandomInt(0, 4);

      const timeSlot = await TimeSlot.create({
        subCourseId: subCourse.dataValues.id,
        weekday: weekDay,
        startTime: startTimes[timeIndex],
        endTime: endTimes[timeIndex],
        location: getRandomElement(locations),
        status: Status.Active,
      } as CreateTimeSlotInput);
      return timeSlot;
    });
    await Promise.all(timeSlotPromises);
    console.log('时间槽创建完成');

    // 创建学生数据
    const studentUsers = await Promise.all(
      Array.from({ length: 50 }, async (_, index) => {
        const isMale = Math.random() > 0.5;
        const lastName = getRandomElement(FIRST_NAMES);
        const firstName = isMale ? getRandomElement(MALE_NAMES) : getRandomElement(FEMALE_NAMES);
        const realName = lastName + firstName;

        const hashedPassword = await bcrypt.hash('student123', 10);
        const user = await User.create({
          username: `student${(1000 + index + 1).toString().padStart(4, '0')}`,
          password: hashedPassword,
          realName,
          studentId: (2023000000 + index + 1).toString().substring(2),
          enrollmentYear: 2023,
          major: getRandomElement(MAJORS),
          status: Status.Active,
          email: `student${index + 1}@example.com`,
          phone: `137${Math.floor(Math.random() * 100000000)
            .toString()
            .padStart(8, '0')}`,
        } as UserCreationAttributes);

        // 关联学生角色
        await UserRole.create({ userId: user.dataValues.id, roleId: studentRole.dataValues.id });

        // 随机分配到一个班级
        const randomClass = getRandomElement(classes);
        await UserClass.create({ userId: user.dataValues.id, classId: randomClass.dataValues.id });

        return user;
      })
    );

    console.log('学生用户创建成功，共创建', studentUsers.length, '名学生');
    console.log('所有基础数据初始化完成！');

    // 确保角色关联正确设置
    console.log('角色关联已在用户创建时正确设置');

    // 分配学生到班级
    for (const classInstance of classes) {
      const course = courses.find(c => c.id === classInstance.courseId);
      if (course) {
        const eligibleStudents = studentUsers.filter(
          student =>
            course.dataValues.availableMajors.includes(student.major) &&
            ((student.enrollmentYear === currentYear &&
              (course.dataValues.semester === 1 || course.dataValues.semester === 2)) ||
              (student.enrollmentYear === currentYear - 1 &&
                (course.dataValues.semester === 3 || course.dataValues.semester === 4)) ||
              (student.enrollmentYear === currentYear - 2 &&
                (course.dataValues.semester === 5 || course.dataValues.semester === 6)) ||
              (student.enrollmentYear === currentYear - 3 &&
                (course.dataValues.semester === 7 || course.dataValues.semester === 8)))
        );

        const selectedStudents = getRandomSubarray(eligibleStudents, getRandomInt(10, 30));
        for (const student of selectedStudents) {
          await UserClass.create({
            userId: student.dataValues.id,
            classId: classInstance.dataValues.id,
          });
        }
      }
    }
    console.log('学生班级分配完成');

    // 生成考勤任务和记录
    const taskCount = 100;
    for (let i = 0; i < taskCount; i++) {
      const classInstance = getRandomElement(classes);
      const startTime = new Date();
      startTime.setDate(startTime.getDate() - getRandomInt(0, 90));
      startTime.setHours(getRandomInt(8, 17));
      startTime.setMinutes(0);

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 2);

      const task = await AttendanceTask.create({
        classId: classInstance.dataValues.id,
        taskName: `考勤任务${i + 1}`,
        taskType: getRandomElement(['课堂考勤', '实验考勤', '作业考勤']),
        startTime,
        endTime,
        status: Status.Active,
      } as AttendanceTaskCreationAttributes);

      // 查找该班级的学生
      const userClasses = await UserClass.findAll({
        where: { classId: classInstance.dataValues.id },
      });
      const enrolledStudentIds = userClasses.map(uc => uc.userId);
      const enrolledStudents = studentUsers.filter(student =>
        enrolledStudentIds.includes(student.dataValues.id)
      );

      // 为部分学生生成考勤记录，但要确保enrolledStudents不为空
      if (enrolledStudents.length === 0) {
        continue;
      }
      const presentCount = Math.max(1, Math.floor(enrolledStudents.length * 0.8));
      const presentStudents = getRandomSubarray(enrolledStudents, presentCount);

      // 为出席的学生创建记录
      for (const student of presentStudents) {
        await AttendanceRecord.create({
          attendanceTaskId: task.dataValues.id,
          userId: student.dataValues.id,
          status: getRandomElement(['present', 'late', 'absent']),
          remark: getRandomElement(['正常出勤', '迟到5分钟', '请假', '']),
        } as AttendanceRecordCreationAttributes);
      }

      console.log(`考勤任务 ${i + 1}/${taskCount} 创建完成`);
    }

    console.log('种子数据生成完成');
  } catch (error) {
    console.error('生成种子数据时出错:', error);
    await sequelize.close();
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行主函数
generateSeedData();
