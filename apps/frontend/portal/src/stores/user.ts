import { getCurrentUser } from '@csisp/oauth';
import { defineStore } from 'pinia';
import { ref } from 'vue';

const STORE_NAME = 'user';

export const useUserStore = defineStore(STORE_NAME, () => {
  const userProfile = ref<{ display_name: string } | null>(null);
  const loading = ref(false);

  const fetchCurrentUser = async () => {
    loading.value = true;
    try {
      const user = await getCurrentUser();
      userProfile.value = user
        ? {
            display_name: user.user_metadata.display_name || '',
          }
        : null;
    } finally {
      loading.value = false;
    }
  };

  const clearUser = () => {
    userProfile.value = null;
  };

  return {
    userProfile,
    loading,
    fetchCurrentUser,
    clearUser,
  };
});
