import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CourseState, Course, Class, Teacher, TimeSlot } from '@/types';
import { courseApi } from '@/api';
import { useMessage } from 'naive-ui';

export const useCourseStore = defineStore('course', () => {
  const state = ref<CourseState>({
    courses: [],
    classes: [],
    teachers: [],
    timeSlots: [],
    loading: false,
  });

  const message = useMessage();

  // 课程管理
  const getCourses = async (params?: any) => {
    state.value.loading = true;
    try {
      const response = await courseApi.getCourses(params);
      state.value.courses = response.data.data;
      return response.data;
    } catch (error) {
      message.error('获取课程列表失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const createCourse = async (courseData: Partial<Course>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.createCourse(courseData);
      state.value.courses.unshift(response.data);
      message.success('创建课程成功');
      return response.data;
    } catch (error) {
      message.error('创建课程失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const updateCourse = async (id: number, courseData: Partial<Course>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.updateCourse(id, courseData);
      const index = state.value.courses.findIndex(c => c.id === id);
      if (index !== -1) {
        state.value.courses[index] = { ...state.value.courses[index], ...response.data };
      }
      message.success('更新课程成功');
      return response.data;
    } catch (error) {
      message.error('更新课程失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const deleteCourse = async (id: number) => {
    state.value.loading = true;
    try {
      await courseApi.deleteCourse(id);
      const index = state.value.courses.findIndex(c => c.id === id);
      if (index !== -1) {
        state.value.courses.splice(index, 1);
      }
      message.success('删除课程成功');
    } catch (error) {
      message.error('删除课程失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 班级管理
  const getClasses = async (params?: any) => {
    state.value.loading = true;
    try {
      const response = await courseApi.getClasses(params);
      state.value.classes = response.data.data;
      return response.data;
    } catch (error) {
      message.error('获取班级列表失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const createClass = async (classData: Partial<Class>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.createClass(classData);
      state.value.classes.unshift(response.data);
      message.success('创建班级成功');
      return response.data;
    } catch (error) {
      message.error('创建班级失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const updateClass = async (id: number, classData: Partial<Class>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.updateClass(id, classData);
      const index = state.value.classes.findIndex(c => c.id === id);
      if (index !== -1) {
        state.value.classes[index] = { ...state.value.classes[index], ...response.data };
      }
      message.success('更新班级成功');
      return response.data;
    } catch (error) {
      message.error('更新班级失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const deleteClass = async (id: number) => {
    state.value.loading = true;
    try {
      await courseApi.deleteClass(id);
      const index = state.value.classes.findIndex(c => c.id === id);
      if (index !== -1) {
        state.value.classes.splice(index, 1);
      }
      message.success('删除班级成功');
    } catch (error) {
      message.error('删除班级失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 教师管理
  const getTeachers = async (params?: any) => {
    state.value.loading = true;
    try {
      const response = await courseApi.getTeachers(params);
      state.value.teachers = response.data.data;
      return response.data;
    } catch (error) {
      message.error('获取教师列表失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const createTeacher = async (teacherData: Partial<Teacher>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.createTeacher(teacherData);
      state.value.teachers.unshift(response.data);
      message.success('创建教师成功');
      return response.data;
    } catch (error) {
      message.error('创建教师失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const updateTeacher = async (id: number, teacherData: Partial<Teacher>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.updateTeacher(id, teacherData);
      const index = state.value.teachers.findIndex(t => t.id === id);
      if (index !== -1) {
        state.value.teachers[index] = { ...state.value.teachers[index], ...response.data };
      }
      message.success('更新教师成功');
      return response.data;
    } catch (error) {
      message.error('更新教师失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const deleteTeacher = async (id: number) => {
    state.value.loading = true;
    try {
      await courseApi.deleteTeacher(id);
      const index = state.value.teachers.findIndex(t => t.id === id);
      if (index !== -1) {
        state.value.teachers.splice(index, 1);
      }
      message.success('删除教师成功');
    } catch (error) {
      message.error('删除教师失败');
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  return {
    // State
    state,

    // Actions
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getClasses,
    createClass,
    updateClass,
    deleteClass,
    getTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
  };
});
