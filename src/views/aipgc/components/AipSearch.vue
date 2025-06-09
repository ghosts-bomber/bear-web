<template>
  <div class="mt-4">
    <el-input
      v-model="input"
      style="max-width: 600px"
      placeholder="输入jira号"
      class="input-with-select"
      @keyup.enter="searchHandle"
    >
      <template #prepend>
        <el-select v-model="select" placeholder="Select" style="width: 115px">
          <el-option v-for="item in select_data" :label="item.key" :value="item.val" />
        </el-select>
      </template>
      <template #append>
        <el-button :icon="Search" @click="searchHandle" />
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import PTApi from "@/api/platform";
import { useAipStore } from "@/store";

const select_data = reactive([
  { key: "AIP", val: "AIP" },
  { key: "GC", val: "GC" },
  { key: "DC", val: "DC" },
]);
const input = ref("");
const select = ref("");
const aipStore = useAipStore();
const router = useRouter();
if (select_data.length > 0) {
  select.value = select_data[0].val;
}

async function searchHandle() {
  let aipcode = select.value + "-" + input.value;
  console.log("aip:", aipcode);
  PTApi.searchApi(aipcode, select.value)
    .then((data) => {
      console.log(data);
      if (data["contents"].length > 0) {
        console.log("add info:", aipcode);
        aipStore.addAipInfo(aipcode, data["contents"][0]);
        router.push({ name: "aipInfo", params: { code: aipcode } });
      }
    })
    .catch()
    .finally();
}
</script>

<style scoped>
.input-with-select .el-input-group__prepend {
  background-color: var(--el-fill-color-blank);
}
</style>
