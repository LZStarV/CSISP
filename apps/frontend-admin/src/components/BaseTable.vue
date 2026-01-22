<template>
  <div class="base-table">
    <!-- 表格工具栏 -->
    <div v-if="$slots.toolbar || showToolbar" class="table-toolbar">
      <slot name="toolbar">
        <div class="toolbar-left">
          <slot name="toolbar-left" />
        </div>
        <div class="toolbar-right">
          <slot name="toolbar-right" />
        </div>
      </slot>
    </div>

    <!-- 表格 -->
    <n-data-table
      :columns="tableColumns"
      :data="data"
      :loading="loading"
      :row-key="resolvedRowKey as any"
      :pagination="paginationConfig"
      :scroll-x="scrollX"
      :scroll-y="scrollY"
      :size="size"
      :striped="striped"
      :single-line="singleLine"
      :single-column="singleColumn"
      @update:checked-row-keys="handleSelectionChange"
    />
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { NDataTable } from 'naive-ui';
import { computed, type PropType } from 'vue';

import type { TableColumn, PaginationConfig } from '@/types';

const props = defineProps({
  data: {
    type: Array as PropType<T[]>,
    required: true,
  },
  columns: {
    type: Array as PropType<TableColumn<T>[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: [Boolean, Object] as PropType<boolean | PaginationConfig>,
    default: true,
  },
  rowKey: {
    type: [String, Function] as PropType<string | ((row: T) => string)>,
    default: 'id',
    required: true,
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String as PropType<'small' | 'medium' | 'large'>,
    default: 'medium',
  },
  striped: {
    type: Boolean,
    default: true,
  },
  singleLine: {
    type: Boolean,
    default: false,
  },
  singleColumn: {
    type: Boolean,
    default: false,
  },
  scrollX: {
    type: [String, Number],
    default: undefined,
  },
  scrollY: {
    type: [String, Number],
    default: undefined,
  },
  showToolbar: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  select: [selectedRowKeys: string[], selectedRows: T[]];
}>();

// 计算属性：处理表格列配置
const tableColumns = computed(() => {
  const cols = props.columns.map(col => {
    const column: any = {
      key: col.key,
      title: col.title,
      width: col.width,
      sortOrder: col.sortable ? false : undefined,
      sorter: col.sortable
        ? (row1: T, row2: T) => {
            const val1 = row1[col.key as keyof T];
            const val2 = row2[col.key as keyof T];
            if (typeof val1 === 'string' && typeof val2 === 'string') {
              return val1.localeCompare(val2);
            }
            return (val1 as any) - (val2 as any);
          }
        : undefined,
    };

    // 自定义渲染
    if (col.render) {
      column.render = (row: T, index: number) => {
        const value = row[col.key as keyof T];
        return col.render!(value, row, index);
      };
    }

    return column;
  });

  // 添加选择列
  if (props.selectable) {
    cols.unshift({
      type: 'selection',
      width: 50,
    });
  }

  return cols;
});

// 计算属性：处理分页配置
const paginationConfig = computed(() => {
  if (props.pagination === false) {
    return false;
  }

  if (props.pagination === true) {
    return {
      pageSize: 10,
      showSizePicker: true,
      pageSizes: [10, 20, 50, 100],
      showQuickJumper: true,
    };
  }

  const onUpdatePage =
    typeof props.pagination.onChange === 'function'
      ? (page: number) => props.pagination.onChange!(page)
      : undefined;

  const onUpdatePageSize =
    typeof (props.pagination as any).onUpdatePageSize === 'function'
      ? (size: number) => (props.pagination as any).onUpdatePageSize!(size)
      : undefined;

  return {
    page: props.pagination.current,
    pageSize: props.pagination.pageSize,
    itemCount: props.pagination.total,
    pageSizes: props.pagination.pageSizeOptions || [10, 20, 50, 100],
    showSizePicker: props.pagination.showSizeChanger !== false,
    showQuickJumper: props.pagination.showQuickJumper !== false,
    onUpdatePage,
    onUpdatePageSize,
  };
});

const resolvedRowKey = computed<(row: T) => string | number>(() => {
  if (typeof props.rowKey === 'function')
    return props.rowKey as (row: T) => string | number;
  const key = props.rowKey as string;
  return (row: T) => row[key as keyof T] as unknown as string | number;
});

// 处理选择变化
const handleSelectionChange = (keys: (string | number)[]) => {
  const selectedRows = props.data.filter((row: T) => {
    const rowKey =
      typeof props.rowKey === 'function'
        ? props.rowKey(row)
        : row[props.rowKey as keyof T];
    return keys.includes(rowKey as string | number);
  });

  emit('select', keys as string[], selectedRows);
};
</script>

<style scoped lang="scss">
.base-table {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}
</style>
