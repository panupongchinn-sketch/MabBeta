<template>
  <div v-if="alarm" class="toast toast-end z-50">
    <div class="alert alert-error flex flex-col items-start gap-1">
      <span class="font-semibold text-sm">{{ alarm.alarm_name }}</span>
      <span v-if="alarm.alarm_code" class="text-xs opacity-80">
        ({{ alarm.alarm_code }})
      </span>
      <span class="text-xs opacity-80">
        Started: {{ formatTime(alarm.start_time) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Alarm {
  alarm_name: string;
  alarm_code?: string;
  start_time: string;
}

interface Props {
  alarm: Alarm | null;
}

defineProps<Props>();

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>
