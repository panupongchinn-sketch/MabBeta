<template>
  <div class="relative w-full h-full">
    <img
      ref="layoutImage"
      src="/factory-layout.png"
      alt="Factory Layout"
      class="w-full h-full object-contain"
      @load="onImageLoad"
    />

    <div
      v-for="point in layoutPoints"
      :key="point.id"
      :style="{
        position: 'absolute',
        left: `${point.x}%`,
        top: `${point.y}%`,
        transform: 'translate(-50%, -50%)'
      }"
      class="cursor-pointer"
      @click="handleDotClick(point)"
    >
      <div
        class="rounded-full border-2 border-white shadow-md w-4 h-4"
        :class="dotClass(point.status)"
        :title="point.label || point.machine?.name"
      />
    </div>

    <AlarmPopup v-if="showAlarmPopup && selectedAlarm" :alarm="selectedAlarm" />
  </div>
</template>

<script setup lang="ts">
interface Machine {
  id: string;
  name: string;
  code: string;
  location?: string;
}

interface LayoutPoint {
  id: string;
  machine_id: string;
  label?: string;
  x: number;
  y: number;
  status: string;
  machine?: Machine;
}

interface Alarm {
  id: string;
  machine_id: string;
  alarm_name: string;
  alarm_code?: string;
  start_time: string;
  end_time?: string;
}

interface Props {
  layoutPoints: LayoutPoint[];
}

defineProps<Props>();

const layoutImage = ref<HTMLImageElement | null>(null);
const selectedAlarm = ref<Alarm | null>(null);
const showAlarmPopup = ref(false);

const { getMachineAlarms } = useMachines();

const onImageLoad = () => {
  console.log("Factory layout image loaded");
};

const dotClass = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "error") return "bg-error animate-pulse";
  if (s === "warning") return "bg-warning";
  return "bg-primary";
};

const handleDotClick = async (point: LayoutPoint) => {
  try {
    const { data: alarms } = await getMachineAlarms(point.machine_id, true);

    if (alarms && alarms.length > 0) {
      selectedAlarm.value = alarms[0] as Alarm;
    } else {
      selectedAlarm.value = {
        id: point.id,
        machine_id: point.machine_id,
        alarm_name: point.label || point.machine?.name || "No active alarm",
        start_time: new Date().toISOString(),
      };
    }

    showAlarmPopup.value = true;
  } catch (e) {
    console.error("Error loading alarms", e);
  }
};
</script>
