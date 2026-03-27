1. 接口规范定义在前端后续API补充设计里,为了方便后端对接,需要你将接口部分统一封装,参考.env以及config.ts中的设计
2. 同1
3. 角色权限矩阵先模糊化处理,因为目前的需求对用户权限不做要求

4. 下载限制方式的就使用ManualQaForm的格式

   ```
   <button
             type="button"
             class="btn btn-ghost btn-sm"
             @click="openUploadDialog"
           >
             上传文档
           </button>
   ```

   ```
   <ManualQaForm
         v-if="showManualForm"
         :loading="qaStore.loading"
         :default-reviewer="authStore.username"
         :create-ready="manualCreateReady"
         @submit="createManualQA"
         @cancel="showManualForm = false"
       />
   ```

5. 下载方式,因为是后端miniIO方式存储源文件,所以采用后端生成临时签名URL,前段直连的下载方式
6. 成员排序的话就默认首字母升序排序,可选择排序方式以及升序降序展示
7. 展示规则的话就使用username]
8. 文档删除和文档详情的话我觉得可以先预留,暂时不做但是预留模块化对接
9. 文档列表的按照几百份上千份的标准做,用户排行目前约定是十几人
10. 设计稿符合目前前端设计风格

