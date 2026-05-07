/**
 * 虾蛋星球 - 种子数据脚本
 * 插入分类和示例工具数据到 Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oqhgrglihrelyzigginq.supabase.co';
const supabaseKey = 'sb_publishable_yK_z8x0ogHJ8Q6tzhulUwA_IvvDEEDr';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('开始插入种子数据...\n');

  // 1. 插入分类数据
  console.log('1. 插入分类数据...');
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .insert([
      { name: '效率工具', icon: 'zap', sort_order: 1 },
      { name: '生活助手', icon: 'home', sort_order: 2 },
      { name: '健康运动', icon: 'heart', sort_order: 3 },
      { name: '学习教育', icon: 'book', sort_order: 4 },
      { name: '娱乐休闲', icon: 'gamepad', sort_order: 5 },
      { name: '金融理财', icon: 'dollar-sign', sort_order: 6 },
      { name: '开发工具', icon: 'code', sort_order: 7 },
      { name: '其他', icon: 'more-horizontal', sort_order: 8 }
    ])
    .select();

  if (catError) {
    console.error('分类数据插入失败:', catError.message);
  } else {
    console.log('✅ 分类数据插入成功:', categories.length, '条');
  }

  // 2. 获取第一个分类的ID，用于工具数据
  const { data: cats } = await supabase.from('categories').select('*').limit(1);
  
  if (!cats || cats.length === 0) {
    console.error('无法获取分类数据，跳过工具插入');
    return;
  }

  // 3. 插入示例工具数据
  console.log('\n2. 插入示例工具数据...');
  const { data: tools, error: toolError } = await supabase
    .from('tools')
    .insert([
      {
        name: '你抽了吗',
        description: '有趣的抽签小程序，每日运势预测',
        category_id: cats[0].id,
        jump_url: 'https://example.com',
        jump_type: 'miniprogram',
        status: 'approved',
        is_premium: true,
        view_count: 128,
        jump_count: 56
      },
      {
        name: '记账小旺财',
        description: '简洁好用的个人记账工具',
        category_id: cats[0].id,
        jump_url: 'https://example.com',
        jump_type: 'miniprogram',
        status: 'approved',
        is_premium: false,
        view_count: 89,
        jump_count: 34
      }
    ])
    .select();

  if (toolError) {
    console.error('工具数据插入失败:', toolError.message);
  } else {
    console.log('✅ 工具数据插入成功:', tools.length, '条');
  }

  console.log('\n✅ 种子数据插入完成！');
}

seed().catch(console.error);
