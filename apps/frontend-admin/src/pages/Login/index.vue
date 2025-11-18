<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="@/assets/logo.svg" alt="CSISP" class="logo" />
        <h1>CSISP 管理系统</h1>
        <p>计算机学院综合服务平台</p>
      </div>

      <n-form
        ref="formRef"
        :model="loginForm"
        :rules="loginRules"
        size="large"
        @submit.prevent="handleLogin"
      >
        <n-form-item path="username">
          <n-input v-model:value="loginForm.username" placeholder="请输入用户名" clearable>
            <template #prefix>
              <n-icon><person-outline /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="password">
          <n-input
            v-model:value="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password-on="click"
            clearable
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <n-icon><lock-closed-outline /></n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item>
          <n-button
            type="primary"
            size="large"
            :loading="loading"
            :block="true"
            @click="handleLogin"
          >
            登录
          </n-button>
        </n-form-item>
      </n-form>

      <div class="login-footer">
        <p>© 2024 计算机学院综合服务平台</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NIcon,
  useMessage,
  type FormInst,
  type FormRules,
} from 'naive-ui';
import { PersonOutline, LockClosedOutline } from '@vicons/ionicons5';
import { useUserStore } from '@/stores';

// 路由
const router = useRouter();

// 状态管理
const userStore = useUserStore();

// UI
const message = useMessage();

// 状态
const formRef = ref<FormInst | null>(null);
const loading = ref(false);

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
});

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间' },
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码长度至少为6个字符' },
  ],
};

// 方法
const handleLogin = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    await userStore.login(loginForm);

    router.push('/');
    message.success('登录成功');
  } catch (error) {
    console.error('Login failed:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 10%);
  padding: 40px 30px;
  text-align: center;
}

.login-header {
  margin-bottom: 30px;

  .logo {
    width: 60px;
    height: 60px;
    margin-bottom: 16px;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 600;
    color: #262626;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #8c8c8c;
  }
}

.login-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;

  p {
    margin: 0;
    font-size: 12px;
    color: #8c8c8c;
  }
}

:deep(.n-form-item) {
  margin-bottom: 20px;
}

:deep(.n-input) {
  .n-input__prefix {
    color: #8c8c8c;
  }
}
</style>
