import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CourseState, Course, Class, Teacher, TimeSlot } from '@/types';
import { courseApi } from '@/api';

export const useCourseStore = defineStore('course', () => {
  const state = ref<CourseState>({
    courses: [],
    classes: [],
    teachers: [],
    timeSlots: [],
    loading: false,
  });

  // 课程管理
  const getCourses = async (params?: any) => {
    state.value.loading = true;
    try {
      const response = await courseApi.getCourses(params);
      state.value.courses = response.data?.data || [];
      return response.data;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const createCourse = async (courseData: Partial<Course>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.createCourse(courseData);
      if (response.data) {
        state.value.courses.unshift(response.data);
      }
      return response.data;
    } catch {
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
      if (index !== -1 && response.data) {
        state.value.courses[index] = { ...state.value.courses[index], ...response.data };
      }
      return response.data;
    } catch {
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
    } catch {
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
      state.value.classes = response.data?.data || [];
      return response.data;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const createClass = async (classData: Partial<Class>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.createClass(classData);
      if (response.data) {
        state.value.classes.unshift(response.data);
      }
      return response.data;
    } catch {
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
      if (index !== -1 && response.data) {
        state.value.classes[index] = { ...state.value.classes[index], ...response.data };
      }
      return response.data;
    } catch {
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
    } catch {
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
      state.value.teachers = response.data?.data || [];
      return response.data;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const createTeacher = async (teacherData: Partial<Teacher>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.createTeacher(teacherData);
      if (response.data) {
        state.value.teachers.unshift(response.data);
      }
      return response.data;
    } catch {
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
      if (index !== -1 && response.data) {
        state.value.teachers[index] = { ...state.value.teachers[index], ...response.data };
      }
      return response.data;
    } catch {
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
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  // 时间安排管理
  const getTimeSlots = async (params?: any) => {
    state.value.loading = true;
    try {
      const response = await courseApi.getTimeSlots(params);
      state.value.timeSlots = response.data?.data || [];
      return response.data;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const createTimeSlot = async (timeSlotData: Partial<TimeSlot>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.createTimeSlot(timeSlotData);
      if (response.data) {
        state.value.timeSlots.unshift(response.data);
      }
      return response.data;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const updateTimeSlot = async (id: number, timeSlotData: Partial<TimeSlot>) => {
    state.value.loading = true;
    try {
      const response = await courseApi.updateTimeSlot(id, timeSlotData);
      const index = state.value.timeSlots.findIndex(t => t.id === id);
      if (index !== -1 && response.data) {
        state.value.timeSlots[index] = { ...state.value.timeSlots[index], ...response.data };
      }
      return response.data;
    } catch {
      throw error;
    } finally {
      state.value.loading = false;
    }
  };

  const deleteTimeSlot = async (id: number) => {
    state.value.loading = true;
    try {
      await courseApi.deleteTimeSlot(id);
      const index = state.value.timeSlots.findIndex(t => t.id === id);
      if (index !== -1) {
        state.value.timeSlots.splice(index, 1);
      }
    } catch {
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
    getTimeSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
  };
});
