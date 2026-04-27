---
name: meoo-image-gen-ai-base64
description: >
  AI文生图+图片编辑能力（Base64版本）。搭建任何AI应用时，需要引入生图、编辑图片能力的入口。提供 qwen-image-2.0（快速同步出图）和 wan2.7-image（高质量同步出图，支持多图参考与组图生成）两种模型，通过Edge Function服务端代理统一鉴权，支持多尺寸输出、多图参考、颜色主题、提示词增强。使用Base64直传图片，无需Cloud Storage。
  【BLOCKING】MUST BE loaded before enable Meoo Cloud service
---

# Meoo AI 图片生成与编辑能力集成（Base64版本）

在 Meoo 项目中接入"用文字生成图片"或"用文字编辑图片"类 AI 能力的标准指南。本版本使用 Base64 直传图片，不依赖 Cloud Storage。

## 技能定位

本技能处理"文字 → 图片"和"文字+图片 → 图片"两个方向的 AI 能力：

- **文生图**：用户提供文字描述，AI 返回生成的图片
- **图像编辑**：用户提供参考图片+文字指令，AI 返回编辑后的图片
- **交互式编辑**：用户框选图片区域+文字指令，AI 在指定位置编辑
- **组图生成**：用户描述一组连贯场景，AI 生成特征一致的多张图片

典型目标：
- 文生图功能
- AI 绘画 /插画生成
- 产品图、海报、头像自动生成
- 风格化图片创作
- 图像编辑与合成（涂鸦喷绘、物体替换等）
-交互式框选编辑
- 批量/组图图片素材生产

如果需要"图片 → 文字"（理解图片内容），应使用 `meoo-vision-ai`。如果是纯文本 AI 能力，应使用 `meoo-llm-ai`。

##和 meoo-agent既有规范的关系

- 工程结构、技术栈、页面组织、通用前后端实现方式，优先遵循 meoo-agent 原有规范。
- 本技能不替代 meoo-agent的通用工程生成能力，只补充"如何把 Meoo AI图片生成/编辑能力接进现有项目"。
- 当 meoo-agent 已经确定项目目录、页面结构、接口风格时，本技能只负责图片生成/编辑相关部分的落点、请求格式、鉴权方式和最小实现约束。

##前置检查

**必须先确认当前项目已开启 Cloud 功能。**

1. 如果工具列表提供 `CloudEnableTool`，优先用它检查 Cloud 状态并引导开启。
2. Cloud 未开启时，禁止继续生成 AI接入代码。必须先让用户开启。
3. 工具不可用时，明确提示用户先开启 Cloud 功能。

## 凭证与接口

Meoo AI 域名：

```
https://api.meoo.host
```

服务 AK **不写在前端**，由 Edge Function从环境变量 `MEOO_PROJECT_API_KEY` 读取。前端通过 Edge Function 间接调用 Meoo AI，无需接触 AK。

图片生成/编辑接口（Edge Function 内部使用）：

```
POST /meoo-ai/api/v1/services/aigc/image-generation/generation
```

请求头（Edge Function 内部使用）：

```http
Authorization: Bearer <MEOO_PROJECT_API_KEY>
Content-Type: application/json
```

不需要 Cookie。

## 模型

| 模型 | 调用方式 | 特点 |
|------|---------|------|
| `qwen-image-2.0` | 仅同步 | 速度快，适合实时预览，prompt 上限 800 字符 |
| `wan2.7-image` | 仅同步 | 质量更高，支持多图输入、组图生成、图像编辑 |

默认使用 `qwen-image-2.0`。用户追求质量时切换到 `wan2.7-image`。

Meoo平台只提供上表中的生图模型。DALL-E、Midjourney、Stable Diffusion 等外部生图服务无法通过本技能接入。如果用户要求使用这些模型，应明确告知不可用，并建议从上表中选择替代。

## ⚠️ 尺寸限制（重要）

不符合限制的尺寸会直接返回 `InvalidParameter`错误。

### qwen-image-2.0 尺寸限制

尺寸格式为 `宽*高`（用星号 `*`分隔，不是 `x` 或 `×`）。

总像素必须在 **512×512 ~ 2048×2048** 范围内（即 262,144 ~ 4,194,304 像素）。

常用安全尺寸：

| 比例 | 尺寸 | 像素数 |
|------|------|--------|
| 1:1 | `1024*1024` | 1,048,576 |
|3:4 竖版 | `768*1024` |786,432 |
| 4:3横版 | `1024*768` | 786,432 |
| 9:16 竖版 | `720*1280` | 921,600 |
| 16:9 横版 | `1280*720` | 921,600 |
| 3:4 高清竖版 | `1120*1440` | 1,612,800 |

默认：`1024*1536`

### wan2.7-image 尺寸限制

wan2.7-image 支持两种指定分辨率的方式（不可混用）：

**方式一：预设分辨率（推荐）**

| size值 | 说明 |
|---------|------|
| `"1K"` | 约 1K 分辨率（~1024×1024 总像素） |
| `"2K"` | 约 2K 分辨率（~2048×2048总像素），默认值 |

**方式二：自定义宽高像素值**

- 文生图：总像素 [768×768,2048×2048]，宽高比 [1:8,8:1]
- 图像编辑/组图：总像素 [768×768,2048×2048]，宽高比 [1:8,8:1]

**注意**：有图片输入时，输出宽高比与输入图像（多图时为最后一张）一致，并缩放到选定分辨率。无图片输入时，输出为正方形。

默认：`"2K"`。追求质量用 `"2K"`，追求速度用 `"1K"`。

###尺寸校验

```ts
function validateImageSize(
  size: string,
  model: 'qwen-image-2.0' | 'wan2.7-image',
  scenario: 'text2img' | 'image-edit' | 'sequential' = 'text2img'
): boolean {
  if (model === 'qwen-image-2.0') {
    const parts = size.split('*');
    if (parts.length !== 2) return false;
 const w = parseInt(parts[0],10);
    const h = parseInt(parts[1], 10);
    const total = w * h;
    return total >= 512 * 512 && total <= 2048 *2048;
  }

  // wan2.7-image：预设值校验
  if (['1K', '2K'].includes(size)) return true;

 // wan2.7-image：自定义宽高校验
  const parts = size.split('*');
  if (parts.length !== 2) return false;
  const w = parseInt(parts[0], 10);
  const h = parseInt(parts[1], 10);
 const total = w * h;
  const ratio = w / h;

  return total >=768 * 768 && total <= 2048 * 2048 && ratio >= 1 / 8 && ratio <= 8;
}
```

## 请求格式

### 文生图（Text-to-Image）

用户输入文字描述，AI 生成图片。

#### qwen-image-2.0同步请求

```json
{
  "model": "qwen-image-2.0",
  "input": {
    "messages": [
      {
        "role": "user",
 "content": [{ "text": "一只坐在窗边的橘猫，暖阳光照射" }]
      }
    ]
  },
  "parameters": {
    "size": "1024*1024"
  }
}
```

#### wan2.7-image 同步请求

```json
{
  "model": "wan2.7-image",
  "input": {
    "messages": [
      {
 "role": "user",
        "content": [{ "text": "一间充满鲜花的温馨花店" }]
      }
    ]
 },
  "parameters": {
    "size": "2K",
 "n": 1,
    "watermark": false,
    "thinking_mode": true
  }
}
```

### 图像编辑（Image Editing）

用户传入一张或多张图片 +文字指令，AI返回编辑后的图片。

```json
{
 "model": "wan2.7-image",
  "input": {
    "messages": [
      {
        "role": "user",
 "content": [
 { "image": "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAA..." },
          { "image": "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAA..." },
          { "text": "把图2的涂鸦喷绘在图1的汽车上" }
        ]
 }
    ]
  },
  "parameters": {
    "size": "2K",
    "n": 1,
    "watermark": false
  }
}
```

**图像编辑注意事项：**
- 可传入 0-9 张图片作为参考
- 多图输入时，在 `content` 数组中按顺序传入多个 `image` 对象
- 图像编辑和组图生成最高支持2K 分辨率，不支持 4K
- 图像编辑不支持 `thinking_mode`参数
- 图片使用 Base64 Data URL 格式：`data:image/{format};base64,{base64string}`

### 交互式编辑（Interactive Editing）

用户传入图片 + 框选区域 + 文字指令，AI 在指定位置编辑。

```json
{
  "model": "wan2.7-image",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [
          { "image": "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAA..." },
          { "image": "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAA..." },
          { "text": "把图1的闹钟放在图2的框选位置，保持场景和光线融合自然" }
        ]
      }
    ]
  },
 "parameters": {
 "bbox_list": [[], [[989,515, 1138, 681]]],
    "size": "2K",
    "n": 1,
    "watermark": false
  }
}
```

**bbox_list格式说明：**
- 列表长度必须与输入图片数量一致
- 无需编辑的图片对应位置传空列表 `[]`
- 坐标格式：`[x1, y1, x2, y2]`（左上角 x,左上角 y,右下角 x,右下角 y）
- 原点为图片左上角 (0,0)，使用原图绝对像素坐标
- 单张图片最多支持 2 个边界框
-示例：输入 3 张图片，图1有2个框，图2无框，图3有1个框：
  ```json
  [
 [[0, 0, 12,12], [25, 25, 100, 100]],
 [],
    [[10, 10, 50, 50]]
 ]
  ```

###组图生成（Sequential Image Generation）

用户描述一组连贯场景，AI 生成特征一致的多张图片。

```json
{
  "model": "wan2.7-image",
 "input": {
 "messages": [
 {
        "role": "user",
        "content": [
          { "text": "电影感组图，记录同一只流浪橘猫，特征必须前后一致。第一张：春天，橘猫穿梭在盛开的樱花树下；第二张：夏天，橘猫在老街的树荫下乘凉避暑；第三张：秋天，橘猫踩在满地的金色落叶上；第四张：冬天，橘猫在雪地上走留下足迹。" }
        ]
      }
    ]
 },
  "parameters": {
    "enable_sequential": true,
 "n": 4,
    "size": "2K"
 }
}
```

**组图生成注意事项：**
- `enable_sequential: true` 启用组图模式
- `n` 代表最大生成图片数量，取值范围 1-12，默认 12。实际数量由模型决定且不超过 n
- 组图最高支持 2K 分辨率，不支持 4K
- 组图不支持 `thinking_mode` 参数
-组图也支持图生组图：传入一张参考图片 +文字描述

###输入图片格式要求

wan2.7系列模型支持 Base64 Data URL 格式输入：

**Base64 Data URL 格式**：

```
data:image/{format};base64,{base64string}
```

示例：
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAA...
```

图片限制：
-格式：JPEG、JPG、PNG（不支持透明通道）、BMP、WEBP
- 分辨率：宽高范围 [240, 8000] 像素，宽高比 [1:8, 8:1]
- 文件大小：不超过 20MB
- 数量：0-9 张

## 完整参数说明

| 参数 |类型 | 说明 | 适用场景 |
|------|------|------|---------|
| `size` | string | 输出分辨率，见上方尺寸限制 |所有场景 |
| `n` | int | 生成图片数量。关闭组图时1-4（默认1）；开启组图时 1-12（默认4） | 所有场景 |
| `watermark` | bool | 是否添加右下角"AI生成"水印，默认 false | 所有场景 |
| `thinking_mode` | bool |是否开启思考模式，默认 true。仅在关闭组图且无图片输入时生效 |文生图 |
| `enable_sequential` | bool | 是否启用组图模式，默认 false | 组图生成 |
| `bbox_list` | List[List[List[int]]] | 交互式编辑框选区域 |交互式编辑 |
| `color_palette` | array |自定义颜色主题，3-10 种颜色，含 hex 和 ratio | 文生图（非组图） |
| `seed` | int |随机数种子 [0, 2147483647]，用于复现稳定输出 | 所有场景 |

**color_palette 示例：**
```json
{
  "color_palette": [
    { "hex": "#FF6B6B", "ratio": "25.00%" },
 { "hex": "#4ECDC4", "ratio": "25.00%" },
 { "hex": "#45B7D1", "ratio": "25.00%" },
    { "hex": "#96CEB4", "ratio": "25.00%" }
  ]
}
```
所有 ratio 值之和必须为 100.00%。

## 响应解析

图片生成的响应结构和普通 LLM 不同，图片 URL 嵌套在 `output.choices[0].message.content` 数组里。

### 同步响应结构

```json
{
  "request_id": "xxx",
  "output": {
    "choices": [
      {
        "finish_reason": "stop",
        "message": {
          "role": "assistant",
          "content": [
            { "image": "https://dashscope-result-xxx.oss-cn-xxx.aliyuncs.com/xxx.png", "type": "image" }
          ]
        }
 }
    ],
    "finished": true
 },
  "usage": {
    "image_count": 1,
 "size": "2048*2048"
  }
}
```

组图生成时，content 数组会包含多张图片：

```json
{
  "output": {
    "choices": [
      {
 "message": {
 "content": [
 { "image": "https://...", "type": "image" },
            { "image": "https://...", "type": "image" },
            { "image": "https://...", "type": "image" },
            { "image": "https://...", "type": "image" }
          ]
 }
      }
    ],
    "finished": true
  },
  "usage": {
    "image_count": 4,
    "size": "2048*2048"
  }
}
```

### 图片 URL 提取

```ts
// 提取单张图片
function extractImageUrl(response: any): string | null {
  return response?.output?.choices?.[0]?.message?.content?.[0]?.image ?? null;
}

// 提取所有图片（组图场景）
function extractAllImageUrls(response: any): string[] {
  const content = response?.output?.choices?.[0]?.message?.content;
  if (!Array.isArray(content)) return [];
  return content.filter((c: any) => c.type === 'image').map((c: any) => c.image);
}
```

**关键提醒：** 返回的图片 URL 是临时链接，有效期约 24 小时。

## Edge Function 服务端模板

文件位置：`/functions/ai-image-gen/index.ts`

```ts
const MEOO_AI_BASE_URL = 'https://api.meoo.host';
const MEOO_PROJECT_SERVICE_AK = Deno.env.get('MEOO_PROJECT_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUTH_HEADERS = {
 'Authorization': `Bearer ${MEOO_PROJECT_SERVICE_AK}`,
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  // CORS 预检
 if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const { prompt, model = 'qwen-image-2.0', size, images = [], ...restParams } = body;

 const defaultSize = model === 'qwen-image-2.0' ? '1024*1536' : '2K';
    const finalSize = size || defaultSize;

    // 构建 content 数组：图片 + 文本
    // images 可以是 URL 或 Base64 Data URL
    const content: Array<{ text?: string; image?: string }> = [];
 for (const img of images) {
      content.push({ image: img });
    }
    content.push({ text: prompt });

    const requestBody: Record<string, unknown> = {
      model,
      input: {
        messages: [{ role: 'user', content }],
      },
 parameters: { size: finalSize, ...restParams },
    };

 // wan2.7-image 不支持 prompt_extend，不要传此参数

    const endpoint = '/meoo-ai/api/v1/services/aigc/image-generation/generation';

    const response = await fetch(`${MEOO_AI_BASE_URL}${endpoint}`, {
 method: 'POST',
      headers: AUTH_HEADERS,
 body: JSON.stringify(requestBody),
    });

 // 转发上游 HTTP 状态码，不吞掉 4xx/5xx
 if (!response.ok) {
      const errorBody = await response.text();
      return new Response(errorBody, {
        status: response.status,
 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
 }

    const data = await response.json();
 return new Response(JSON.stringify(data), {
 headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
 } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Server Error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

部署：

```ts
CloudDeployFunction({ functionName: "ai-image-gen", verifyJwt: true })
```

## 前端调用方式

### SDK 调用（推荐）

```ts
import { supabase } from 'src/supabase/client.ts';

export async function generateImage(
  prompt: string,
  model: 'qwen-image-2.0' | 'wan2.7-image' = 'qwen-image-2.0',
  size?: string,
  options?: {
 images?: string[]; // URL 或 Base64 Data URL
 n?: number;
 watermark?: boolean;
 thinking_mode?: boolean;
    enable_sequential?: boolean;
    seed?: number;
    bbox_list?: number[][][];
    color_palette?: { hex: string; ratio: string }[];
  }
) {
  const { data, error } = await supabase.functions.invoke('ai-image-gen', {
    body: { prompt, model, size, ...options },
  });
  if (error) throw error;
  return data;
}

function extractImageUrl(response: any): string | null {
  return response?.output?.choices?.[0]?.message?.content?.[0]?.image ?? null;
}

function extractAllImageUrls(response: any): string[] {
  const content = response?.output?.choices?.[0]?.message?.content;
  if (!Array.isArray(content)) return [];
  return content.filter((c: any) => c.type === 'image').map((c: any) => c.image);
}
```

### 本地图片转 Base64

```ts
/**
 * 将用户本地图片转为 Base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result); // 完整的 Data URL: data:image/jpeg;base64,...
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 结合图片生成 API 使用

```ts
//图像编辑：本地图片转Base64后调用
const file = document.querySelector('input[type="file"]')?.files?.[0];
if (file) {
  const base64Image = await fileToBase64(file);
  const result = await generateImage(
    '把这张图片变成卡通风格',
    'wan2.7-image',
    '2K',
    { images: [base64Image] }
  );
}
```

## 集成优先级

默认按下面优先级集成：

1. 优先通过 Edge Function 调用 Meoo AI，AK 存放在服务端环境变量中。
2. 如果项目已有统一请求封装（如 supabase client），优先复用它。
3.如果项目已有现成页面，只在该页面上嵌入生图/编辑能力，不要新造一整套无关页面。
4. 只有图片 生成/编辑功能本身需要的代码才产出，不扩展无关系统。

不要默认做这些事：

-不要重建整个工程目录
- 不要默认创建独立图片生成站点或完整 AI 子系统
- 不要默认加数据库、登录、权限，除非用户明确要求
-不要因为一个生图功能就新建与需求无关的全局状态或页面骨架

##优先产出的代码

通常只需要产出和图片生成/编辑功能直接相关的代码：

-一个 Edge Function 文件（`/functions/ai-image-gen/index.ts`）
- 一个前端请求封装文件
- 一个前端生图/编辑组件（输入提示词/上传图片 + 展示生成结果）
- 必要的状态处理：loading、error、图片展示

常见落地路径：

- `/functions/ai-image-gen/index.ts`（Edge Function）
- `src/services/meooImageGen.ts`（前端请求封装）
- `src/components/ai/ImageGenerator.tsx`（生图组件）
- `src/components/ai/ImageEditor.tsx`（图像编辑组件）
-现有页面中的一个生图/编辑面板 /按钮

## 执行步骤

1.确认用户需求属于图片生成（文字 →图片）或图片编辑（文字+图片 → 图片）。
2. 定位现有项目中的落点——在哪个页面或模块需要生图/编辑能力。
3. 检查 Cloud 功能是否开启（未开启则停止）。
4. 确定场景类型：文生图、图像编辑、交互式编辑、组图生成。
5.确定尺寸需求并校验是否在模型允许范围内。
6. 创建或复用 Edge Function（`ai-image-gen`），确保 AK 从环境变量读取。
7. 部署 Edge Function：`CloudDeployFunction({ functionName: "ai-image-gen", verifyJwt: true })`。
8. 前端通过 supabase SDK 调用 Edge Function。
9. 根据场景选择模型和调用方式：
   -实时预览、快速出图 → `qwen-image-2.0`
   - 追求质量 → `wan2.7-image`
 - 图像编辑/交互式编辑 → `wan2.7-image`
   - 组图生成 → `wan2.7-image` + `enable_sequential: true`
10. 正确解析响应，提取图片 URL（单张或多张）。
11. 完成请求接入、图片展示、错误处理和 loading 状态。

## 典型场景

### 场景一：文生图功能

优先交付：

-一个 Edge Function（`ai-image-gen`）处理生图请求
- 一个提示词输入 + 图片展示组件
- 模型和尺寸选择（可选，默认 qwen-image-2.0 + 1024*1536）
- loading和 error 状态处理

### 场景二：批量素材生产

优先交付：

-复用 Edge Function，前端循环同步调用
- 批量任务提交和进度展示
-生成结果列表展示和下载

### 场景三：产品图 / 海报自动生成

优先交付：

-在现有产品页或编辑页增加"AI 生成图片"入口
- 将产品描述映射为生图提示词
-生成结果预览和应用到产品

### 场景四：图像编辑（多图合成）

优先交付：

- 上传图片组件（支持多图上传，转Base64）
-编辑指令输入框
- 模型选择（wan2.7-image）
- 编辑结果展示

### 场景五：交互式编辑（框选编辑）

优先交付：

-图片展示 + 框选工具（支持在图片上画矩形框）
- 编辑指令输入框
- bbox_list 参数构建和传递
-编辑结果展示

### 场景六：组图生成

优先交付：

- 组图描述输入框（描述多张连贯场景）
- 图片数量选择（1-12）
- 模型选择（wan2.7-image）
- 组图结果展示（横向/纵向滚动或网格布局）
- 使用 `enable_sequential: true` 参数

## UI 集成建议

把生图/编辑能力当成"现有页面的一个功能块"去实现，而不是当成一个独立产品去重做。

优先采用下面这些嵌入方式：

- 页面中的"AI 生图"按钮
- 侧边面板的生图/编辑工具
- 编辑器内的图片生成插件
- 产品详情页的 AI 配图入口

如果用户没有要求复杂交互，默认做最小闭环：

1. 提示词输入框（和/或图片上传区）
2. 生成/编辑按钮
3.图片展示区
4. loading 状态
5. error 状态

## 默认策略

- 默认模型 `qwen-image-2.0`（同步，速度快）
- 默认尺寸：qwen-image-2.0 用 `1024*1536`，wan2.7 系列用 `"2K"`
-默认通过 Edge Function调用，AK 不暴露在前端
- 默认使用 supabase SDK 或原生 `fetch`，不用任何第三方 SDK
-默认不传 `thinking_mode`（让 API 使用默认值 true）
- 默认不传 `watermark`（让 API 使用默认值 false）
- 本地图片使用 Base64 Data URL 格式传输

## 强约束

- 必须先确认 Cloud已开启
-不使用 DALL-E、Stable Diffusion 或任何第三方生图 API
- AK 必须存放在 Edge Function 环境变量中，禁止硬编码在前端
- 模型名必须严格使用 `qwen-image-2.0` 或 `wan2.7-image`
- wan2.7-image 的 size 预设值为 `"1K"` 或 `"2K"`，不要与 `宽*高` 格式混用
- wan2.7-image不支持 `prompt_extend`，禁止传此参数
- qwen-image-2.0 的 size格式必须为 `宽*高`（星号分隔，无空格），像素范围 512×512 ~ 2048×2048
- Edge Function 必须处理 CORS 预检请求（OPTIONS）
- Edge Function必须 try-catch，catch 返回 `{ error: string }` + 500
- Edge Function 必须转发上游 HTTP 状态码，不得吞掉4xx/5xx
- 部署后生效——代码修改必须重新 `CloudDeployFunction`
- 部署 Edge Function 时使用 `CloudDeployFunction`
- 不因接入生图而做无关的工程改造
- bbox_list长度必须与输入图片数量一致，无需编辑的图片传空列表 `[]`
- color_palette 的 ratio 之和必须为 100.00%
- 组图模式（enable_sequential=true）不支持 thinking_mode
- 本地图片使用 Base64 Data URL 格式：`data:image/{format};base64,{base64string}`
- 图片文件大小不超过 20MB

## 异常处理

遇到下面情况时，按固定策略处理：

- 如果 Cloud功能尚未开启，立即停止当前 AI 集成实现，明确告知用户"必须先开启 Cloud功能"。
-如果需求已经变成文本对话或视觉理解，不继续沿用本技能，引导使用对应的 llm-ai 或 vision-ai 技能。
- 如果返回 `InvalidParameter`，按下方排查清单逐项检查。
-如果 Edge Function 部署失败，检查环境变量 `MEOO_PROJECT_API_KEY` 是否已配置。
-如果请求返回 401，检查 Edge Function中的 AK 是否正确读取。
- 如果 Base64 过大导致请求超时，建议压缩图片。

## 常见 InvalidParameter 排查

图片生成/编辑接口对参数格式要求严格，以下是最常见的报错原因和解决方式：

### 1. size 格式错误

**错误写法：** `"1024x1024"`、`"1024×1024"`、`"1024 *1024"`

**正确写法：** `"1024*1024"`（纯星号，无空格）或 `"1K"`/`"2K"`

### 2. size 超出允许范围

- 给 wan2.7-image 传 `"1280*1280"` → 应改为 `"1K"`或 `"2K"`
- 给 wan2.7-image传 `"3K"` → 不是合法值
-给 qwen-image-2.0 传 `"256*256"` → 像素数低于下限

### 3. model名称拼写错误

必须严格使用 `qwen-image-2.0` 或 `wan2.7-image`，常见错误：

- `z-image`（旧名称，已弃用）
- `qwen-wan`（旧名称，已弃用）
- `wanx-v1`（V1 版，本技能不使用）
- `wan2.6-t2i`（旧版，已升级）

### 4. 给 wan2.7 传了 prompt_extend

wan2.7-image不支持 `prompt_extend` 参数，传了会返回 InvalidParameter。必须移除。

### 5. prompt 超长

qwen-image-2.0 的 prompt限制为 800字符（中英文均算）。wan2.7-image 为5000 字符。超过部分会自动截断。

### 6. input 结构错误

请求体中 `input.messages` 的结构必须严格遵守规范，content必须是数组，每个元素是 `{ text: "..." }`或 `{ image: "..." }`。

### 7. bbox_list 格式错误

- 列表长度必须与输入图片数量一致
- 坐标必须是 `[x1, y1, x2, y2]` 格式
- 单张图片最多 2 个框

### 8. color_palette格式错误

-必须包含 3-10 种颜色
- 每个颜色必须有 `hex` 和 `ratio` 字段
- 所有 ratio 之和必须为100.00%

## 完成标准

- 已确认 Cloud功能开启
- Edge Function 已创建并部署，AK 从环境变量读取
- 前端通过 supabase SDK 或 fetch调用 Edge Function
- 文本输入和图片输出正常工作
-正确解析响应结构，能从 `output.choices[0].message.content` 提取图片 URL
- 尺寸参数在目标模型允许范围内
- 具备 loading、error 状态处理
- 代码只涉及图片生成/编辑功能本身
-支持文生图、图像编辑、交互式编辑、组图生成四种场景（按用户需求选择）
- 本地图片成功转为 Base64 Data URL 并用于 API 调用
