/**
 * Database Seed Script — Chinese Poem Questions
 * "腹有诗书气自华" 诗词大会预选赛题目
 * Run with: npm run db:seed
 */

import { PrismaClient, Prisma, QuestionType, EventPhase, Role } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Diagnostic: Check if environment variables are visible
console.log('🔍 Checking environment...');
console.log('   DATABASE_URL present:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  console.log('   DATABASE_URL length:', process.env.DATABASE_URL.length);
  console.log('   DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 15));
}

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;

// Prioritize system environment (Render) over .env file
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL environment variable is not set or empty.');
  console.log('   Available keys:', Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('PASSWORD')));
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Cleaning database (wiping all previous data)...');
  
  // Delete in order to respect foreign key constraints
  await prisma.submission.deleteMany();
  await prisma.score.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.question.deleteMany();

  console.log('🌱 Seeding database with fresh data...');

  // ── Create 3 Specific Accounts ──
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);
  const hashedUserPassword = await bcrypt.hash('password123', 12);

  // Admin 1
  await prisma.user.create({
    data: {
      username: 'admin1',
      password: hashedAdminPassword,
      role: Role.ADMIN,
      fullName: '管理员一号',
      grade: '教师',
      studentId: 'ADMIN-001',
      profileComplete: true,
    },
  });

  // Admin 2
  await prisma.user.create({
    data: {
      username: 'admin2',
      password: hashedAdminPassword,
      role: Role.ADMIN,
      fullName: '管理员二号',
      grade: '教师',
      studentId: 'ADMIN-002',
      profileComplete: true,
    },
  });

  // Test User
  await prisma.user.create({
    data: {
      username: 'testuser',
      password: hashedUserPassword,
      role: Role.USER,
      fullName: '测试学生',
      grade: '高一',
      studentId: 'TEST-2026',
      profileComplete: true,
    },
  });

  console.log('✅ 3 accounts created (admin1, admin2, testuser)');

  // ══════════════════════════════════════════════
  // 一、选择题 (Multiple Choice) — 12s, 2pts each
  // ══════════════════════════════════════════════
  const mcQuestions = [
    {
      order: 1,
      questionText: '下列诗句所描写的街景，哪一项与其他两项不在同一城市？\nA. 百千家似围棋局，十二街如种菜畦。\nB. 天街小雨润如酥，草色遥看近却无。\nC. 十里长街市井连，月明桥上看神仙。',
      options: ['A', 'B', 'C'],
      correctAnswer: 'C',
      explanation: 'A描写长安（白居易），B描写长安（韩愈），C描写扬州（张祜）。',
    },
    {
      order: 2,
      questionText: '苏轼"老夫聊发少年狂，左牵黄，右擎苍"中的"黄"和"苍"分别指？',
      options: ['黄马、苍鹰', '黄犬、苍鹰', '黄犬、黑犬'],
      correctAnswer: '黄犬、苍鹰',
      explanation: '"黄"指黄犬，"苍"指苍鹰。出自《江城子·密州出猎》。',
    },
    {
      order: 3,
      questionText: '以下哪句诗中所提到的植物不会出现在日本江户时代的儒学者细井徇的《诗经名物图解》中？',
      options: [
        '杨柳青青江水平，闻郎江上踏歌声。',
        '玄都观里桃千树，尽是刘郎去后栽。',
        '年年战骨埋荒外，空见蒲桃入汉家。',
      ],
      correctAnswer: '年年战骨埋荒外，空见蒲桃入汉家。',
      explanation: '"蒲桃"即葡萄，是西域传入的，不在《诗经》名物中。',
    },
    {
      order: 4,
      questionText: '下列诗句中，哪一项是正确的？',
      options: [
        '天下三分明月夜，二分无奈是扬州',
        '天下三分明月夜，二分无赖是扬州',
        '天下三分明月夜，二分无耐是扬州',
      ],
      correctAnswer: '天下三分明月夜，二分无赖是扬州',
      explanation: '出自徐凝《忆扬州》，"无赖"在此处意为可爱、令人喜爱。',
    },
    {
      order: 5,
      questionText: '孙悟空正在菩提祖师这里学本领，师父用戒尺把他的头打了三下，一句话没说就进去了。下列李白诗句中，哪一联预言了此事？',
      options: [
        '仙人抚我顶，结发受长生。',
        '西上莲花山，迢迢见明星。',
        '虎鼓瑟兮鸾回车，仙之人兮列如麻。',
      ],
      correctAnswer: '仙人抚我顶，结发受长生。',
      explanation: '"仙人抚我顶"暗合菩提祖师敲孙悟空头三下传授长生之道的情节。',
    },
    {
      order: 6,
      questionText: '"蚕丛及鱼凫，开国何茫然"，其中"蚕丛"和"鱼凫"指的是？',
      options: ['两位帝王', '两种动物', '两座城市'],
      correctAnswer: '两位帝王',
      explanation: '蚕丛和鱼凫是古蜀国的两位开国帝王。出自李白《蜀道难》。',
    },
    {
      order: 7,
      questionText: '下列诗句中"儿女"，不是指儿童的是？',
      options: [
        '呼童烹鸡酌白酒，儿女嬉笑牵人衣。',
        '遥怜小儿女，未解忆长安。',
        '无为在歧路，儿女共沾巾。',
      ],
      correctAnswer: '无为在歧路，儿女共沾巾。',
      explanation: '此处"儿女"指青年男女（离别时的恋人），不是儿童。出自王勃《送杜少府之任蜀州》。',
    },
    {
      order: 8,
      questionText: '"九州生气恃风雷，万马齐喑究可哀"中哪个字是错误的？',
      options: ['州（错）——洲', '侍（错）——恃', '喑（错）——咽'],
      correctAnswer: '侍（错）——恃',
      explanation: '正确为"恃"（依赖），不是"侍"。出自龚自珍《己亥杂诗》。',
    },
    {
      order: 9,
      questionText: '李贺诗句"何当金络脑，快走踏清秋"中"金络脑"指的是？',
      options: ['一种武器', '马的笼头', '一种香料'],
      correctAnswer: '马的笼头',
      explanation: '"金络脑"指用金子装饰的马笼头。出自李贺《马诗》。',
    },
    {
      order: 10,
      questionText: '下列咏蝉名句中，哪一联能激励我们积极上进？',
      options: [
        '居高声自远，非是藉秋风。',
        '露重飞难进，风多响易沉。',
        '本以高难饱，徒劳恨费声。',
      ],
      correctAnswer: '居高声自远，非是藉秋风。',
      explanation: '虞世南此句以蝉喻人，品格高洁自能声名远播，不假外力。',
    },
    {
      order: 11,
      questionText: '以下哪一项提到的"牛"与其他两项不同？',
      options: [
        '班姬此夕愁无限，河汉三更看斗牛。',
        '日之夕矣，牛羊下来。',
        '烹羊宰牛且为乐，会须一饮三百杯。',
      ],
      correctAnswer: '班姬此夕愁无限，河汉三更看斗牛。',
      explanation: 'A中的"斗牛"是星宿名（北斗星和牛宿星），B、C中的"牛"是动物。',
    },
    {
      order: 12,
      questionText: '下列诗句中，哪一项是正确的？',
      options: [
        '山随平野尽，月涌大江流。',
        '星垂平野阔，江入大荒流。',
        '山随平野尽，江入大荒流。',
      ],
      correctAnswer: '山随平野尽，江入大荒流。',
      explanation: '出自李白《渡荆门送别》，正确为"山随平野尽，江入大荒流"。',
    },
    {
      order: 13,
      questionText: '以下词牌名中包含的行为，哪一项发生在秋天？',
      options: ['采桑子', '踏莎行', '捣练子'],
      correctAnswer: '捣练子',
      explanation: '"捣练"是秋天为制冬衣而捶打丝绢的活动。',
    },
    {
      order: 14,
      questionText: '"楚王好细腰，宫中多饿死"中"细腰"指的是谁的腰？',
      options: ['楚国君王的腰', '楚国大臣的腰', '楚国美女的腰'],
      correctAnswer: '楚国大臣的腰',
      explanation: '出自《墨子》，楚灵王喜欢细腰，大臣们节食求细腰，导致饿死。',
    },
    {
      order: 15,
      questionText: '刘禹锡"晚来风起花如雪，飞入宫墙不见人"，这里的花指的是？',
      options: ['梅花', '梨花', '柳絮'],
      correctAnswer: '柳絮',
      explanation: '"花如雪"形容柳絮飘飞如雪。出自刘禹锡《杨柳枝词》。',
    },
  ];

  for (const q of mcQuestions) {
    await prisma.question.upsert({
      where: { id: `mc_${q.order}` },
      update: { ...q, phase: EventPhase.PRE_QUALIFIER, type: QuestionType.MULTIPLE_CHOICE, keywords: Prisma.JsonNull, timeLimit: 12, points: 2 },
      create: {
        id: `mc_${q.order}`,
        type: QuestionType.MULTIPLE_CHOICE,
        phase: EventPhase.PRE_QUALIFIER,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        keywords: Prisma.JsonNull,
        explanation: q.explanation,
        points: 2,
        timeLimit: 12,
        order: q.order,
      },
    });
  }
  console.log(`✅ ${mcQuestions.length} 选择题已导入`);

  // ══════════════════════════════════════════════
  // 二、简答题 (Short Answer) — 15s, 3pts each
  // ══════════════════════════════════════════════
  const saQuestions = [
    {
      order: 16,
      questionText: '苏轼有诗云"三杯软饱后，一枕黑甜馀"，试推测"黑甜"是什么意思？',
      correctAnswer: '酒',
      keywords: ['酒', '美酒', '喝', '醉'],
      explanation: '"黑甜"是酒的雅称。',
      points: 3,
    },
    {
      order: 17,
      questionText: '"赤橙黄绿青蓝紫，谁持彩练当空舞"，描写的是什么？',
      correctAnswer: '彩虹',
      keywords: ['彩虹', '虹', '彩', '彩虹桥'],
      explanation: '出自毛泽东《菩萨蛮·大柏地》，描写彩虹。',
      points: 3,
    },
    {
      order: 18,
      questionText: '"青州从事来偏熟，泉布先生老渐悭"这里的"泉布先生"指的是什么？',
      correctAnswer: '钱',
      keywords: ['钱', '金钱', '铜钱', '银', '货币'],
      explanation: '"泉布"是钱的古称。',
      points: 3,
    },
    {
      order: 19,
      questionText: '杜牧名句"春风十里扬州路，卷上珠帘总不如"写于初到扬州还是离开扬州之时？',
      correctAnswer: '离开扬州',
      keywords: ['离开', '离去', '走', '别', '离别', '离开扬州'],
      explanation: '出自杜牧《赠别二首》，是离开扬州时所作。',
      points: 3,
    },
    {
      order: 20,
      questionText: '"闲敲棋子落灯花"中以无声衬有声的是哪个字？',
      correctAnswer: '敲',
      keywords: ['敲', '闲敲'],
      explanation: '"敲"字以动作之声衬寂静。出自赵师秀《约客》。',
      points: 3,
    },
    {
      order: 21,
      questionText: '"锦帽貂裘，千骑卷平冈"描绘了什么场景？',
      correctAnswer: '狩猎',
      keywords: ['狩猎', '打猎', '行猎', '猎', '出猎', '围猎'],
      explanation: '出自苏轼《江城子·密州出猎》，描绘打猎场景。',
      points: 3,
    },
    {
      order: 22,
      questionText: '"苦宫市也"是哪首诗的诗人自注？',
      correctAnswer: '卖炭翁',
      keywords: ['卖炭翁'],
      explanation: '出自白居易《卖炭翁》的小序自注。',
      points: 3,
    },
    {
      order: 23,
      questionText: '请通过以下关键词和提示字，说出诗词名句。\n关键词：水果 苏轼 旷达\n提示字：□□□□□□□，□辞□□□□□。',
      correctAnswer: '日啖荔枝三百颗',
      keywords: ['日啖荔枝三百颗', '不辞长作岭南人', '荔枝'],
      explanation: '出自苏轼《惠州一绝》：日啖荔枝三百颗，不辞长作岭南人。',
      points: 3,
    },
    {
      order: 24,
      questionText: '请通过以下关键词和提示字，说出诗词名句。\n关键词：韩愈 发芽 春天\n提示字：□□□□润□□，□□□□□□□。',
      correctAnswer: '天街小雨润如酥',
      keywords: ['天街小雨润如酥', '草色遥看近却无', '小雨润如酥'],
      explanation: '出自韩愈《早春呈水部张十八员外》。',
      points: 3,
    },
    {
      order: 25,
      questionText: '请通过以下关键词和提示字，说出诗词名句。\n关键词：韦应物 下雨 空船\n提示字：□□□□□□□，野□□□□□□。',
      correctAnswer: '春潮带雨晚来急',
      keywords: ['春潮带雨晚来急', '野渡无人舟自横', '春潮带雨'],
      explanation: '出自韦应物《滁州西涧》。',
      points: 3,
    },
  ];

  for (const q of saQuestions) {
    await prisma.question.upsert({
      where: { id: `sa_${q.order}` },
      update: {},
      create: {
        id: `sa_${q.order}`,
        type: QuestionType.SHORT_ANSWER,
        phase: EventPhase.PRE_QUALIFIER,
        questionText: q.questionText,
        options: Prisma.JsonNull,
        correctAnswer: q.correctAnswer,
        keywords: q.keywords,
        explanation: q.explanation,
        points: q.points,
        timeLimit: 20,
        order: q.order,
      },
    });
  }
  console.log(`✅ ${saQuestions.length} 简答题已导入`);

  // ══════════════════════════════════════════════
  // 三、描述线索题 (Clue-based) — 20s, 4pts each
  // ══════════════════════════════════════════════
  const clueQuestions = [
    {
      order: 26,
      questionText: '请根据以下线索，猜一种水果。\n线索一：在范成大笔下，它是黄灿灿的。\n线索二：在杨万里笔下，它是酸溜溜的。\n线索三：在贺铸笔下，它是湿漉漉的。\n线索四：李清照见到它，表情羞答答的。',
      correctAnswer: '梅子',
      keywords: ['梅子', '梅', '青梅', '黄梅', '杨梅'],
      explanation: '梅子在古诗词中频繁出现，范成大写"梅子金黄"，杨万里写"梅子留酸"等。',
      points: 4,
    },
    {
      order: 27,
      questionText: '请根据以下线索，说出一个四字成语。\n线索一：它最早出现在一首唐诗中。\n线索二：这首诗关乎一个好消息。\n线索三：作者曾在长安策马狂奔。\n线索四：成语中包含"春风"。',
      correctAnswer: '春风得意',
      keywords: ['春风得意', '春风得意马蹄疾'],
      explanation: '出自孟郊《登科后》：春风得意马蹄疾，一日看尽长安花。',
      points: 4,
    },
    {
      order: 28,
      questionText: '请根据以下线索，猜一种动物。\n线索一：它在小池中穿行千里与诗人相遇。\n线索二：它在青草边尽情嬉戏与儿童相逢。\n线索三：它喜欢跃出水面与细雨相逢。\n线索四：它在汉乐府《江南》里与莲叶相逢。',
      correctAnswer: '鱼',
      keywords: ['鱼', '鱼儿', '小鱼', '金鱼', '鲤鱼'],
      explanation: '汉乐府《江南》：江南可采莲，莲叶何田田，鱼戏莲叶间。',
      points: 4,
    },
    {
      order: 29,
      questionText: '请根据以下线索，说出一种植物。\n线索一：红楼梦中众姊妹曾咏过它。\n线索二：元好问借它警戒孩子，对待感情要慎重。\n线索三：苏轼曾深夜燃烛，只为不错过它。\n线索四：李清照描述它绿肥红瘦。',
      correctAnswer: '海棠',
      keywords: ['海棠', '海棠花'],
      explanation: '李清照"知否知否，应是绿肥红瘦"写的就是海棠。苏轼"只恐夜深花睡去，故烧高烛照红妆"也是海棠。',
      points: 4,
    },
    {
      order: 30,
      questionText: '请根据以下线索，猜一位诗人。\n线索一：在苏州，他游过月光下的虎丘。\n线索二：在扬州，他梦见了苏州的阁楼。\n线索三：在杭州，他见过钱塘江的潮头。\n线索四：在回忆里，他说他最爱的是杭州。',
      correctAnswer: '白居易',
      keywords: ['白居易', '乐天', '白乐天'],
      explanation: '白居易曾任杭州刺史，写下"江南忆，最忆是杭州"、"山寺月中寻桂子，郡亭枕上看潮头"等名句。',
      points: 4,
    },
  ];

  for (const q of clueQuestions) {
    await prisma.question.upsert({
      where: { id: `clue_${q.order}` },
      update: {},
      create: {
        id: `clue_${q.order}`,
        type: QuestionType.SHORT_ANSWER,
        phase: EventPhase.PRE_QUALIFIER,
        questionText: q.questionText,
        options: Prisma.JsonNull,
        correctAnswer: q.correctAnswer,
        keywords: q.keywords,
        explanation: q.explanation,
        points: q.points,
        timeLimit: 25,
        order: q.order,
      },
    });
  }
  console.log(`✅ ${clueQuestions.length} 描述线索题已导入`);

  // ══════════════════════════════════════════════
  // 四、描述线索题进阶版 — 20s, 5pts each
  // ══════════════════════════════════════════════
  const advancedClueQuestions = [
    {
      order: 31,
      questionText: '请根据以下线索，猜出一座名山。\n线索一：它是屈原理想的仙境。\n线索二：它是黄河"咆哮万里触龙门"的起点。\n线索三：它是周穆王"八骏日行三万里"的终点。\n线索四：毛泽东说它"飞起玉龙三百万，搅得周天寒彻"。',
      correctAnswer: '昆仑山',
      keywords: ['昆仑山', '昆仑', '昆仑山脉'],
      explanation: '毛泽东《念奴娇·昆仑》："飞起玉龙三百万，搅得周天寒彻。"',
      points: 5,
    },
    {
      order: 32,
      questionText: '根据以下线索，猜一种零食。\n线索一：它的原材料"累累嵌成万颗珠"。\n线索二：它的制作过程"大弦嘈嘈如急雨"。\n线索三：吃多了就会"唇焦口燥呼不得"。\n线索四：吃它的场合可以借用"雨来看电影"表达。',
      correctAnswer: '爆米花',
      keywords: ['爆米花', '爆玉米', '米花'],
      explanation: '玉米粒在高温高压下爆裂成爆米花，"大弦嘈嘈如急雨"形容爆裂声。',
      points: 5,
    },
    {
      order: 33,
      questionText: '请根据以下线索，猜一种食物。\n线索一：它的搭档：春韭秋葵共讨论。\n线索二：它的外观：凝结釜中浓似酪。\n线索三：它的制作流程：不教渣滓稍分留。\n线索四：它的制作工具：朝朝只与磨为亲。',
      correctAnswer: '豆腐',
      keywords: ['豆腐'],
      explanation: '豆腐由黄豆磨浆制成，"朝朝只与磨为亲"指磨豆的过程。',
      points: 5,
    },
    {
      order: 34,
      questionText: '请根据以下线索猜出一种旅游装备。\n线索一：陆游带着它，打算重游山西村。\n线索二：李白有了它，五岳寻仙不辞远。\n线索三：夸父有了它，化作一片邓林。\n线索四：苏轼有了它，何妨吟啸且徐行。',
      correctAnswer: '手杖',
      keywords: ['手杖', '拐杖', '竹杖', '杖', '登山杖'],
      explanation: '苏轼《定风波》："竹杖芒鞋轻胜马"，手杖是古代旅行常用装备。',
      points: 5,
    },
  ];

  for (const q of advancedClueQuestions) {
    await prisma.question.upsert({
      where: { id: `adv_${q.order}` },
      update: {},
      create: {
        id: `adv_${q.order}`,
        type: QuestionType.SHORT_ANSWER,
        phase: EventPhase.PRE_QUALIFIER,
        questionText: q.questionText,
        options: Prisma.JsonNull,
        correctAnswer: q.correctAnswer,
        keywords: q.keywords,
        explanation: q.explanation,
        points: q.points,
        timeLimit: 25,
        order: q.order,
      },
    });
  }
  console.log(`✅ ${advancedClueQuestions.length} 描述线索题进阶版已导入`);

  console.log('\n🎉 诗词大会预选赛题目导入完成！');
  console.log('📊 统计：');
  console.log('   选择题：15题（每题12秒，2分）');
  console.log('   简答题：10题（每题20秒，3分）');
  console.log('   描述线索题：5题（每题25秒，4分）');
  console.log('   描述线索题进阶：4题（每题25秒，5分）');
  console.log(`   总计：${mcQuestions.length + saQuestions.length + clueQuestions.length + advancedClueQuestions.length}题，满分 ${mcQuestions.length * 2 + saQuestions.length * 3 + clueQuestions.length * 4 + advancedClueQuestions.length * 5}分`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
