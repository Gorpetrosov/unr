import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.admin,
      displayName: 'Horizon Editor',
      bio: {
        en: 'Editor of Horizon Notes. Essays, notes, and bilingual dispatches.',
        ru: 'Редактор Horizon Notes. Эссе, заметки и двуязычные репортажи.',
      },
    },
    create: {
      email,
      passwordHash,
      role: Role.admin,
      displayName: 'Horizon Editor',
      slug: 'horizon-editor',
      bio: {
        en: 'Editor of Horizon Notes. Essays, notes, and bilingual dispatches.',
        ru: 'Редактор Horizon Notes. Эссе, заметки и двуязычные репортажи.',
      },
    },
  });

  if (!admin.slug) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { slug: 'horizon-editor', displayName: 'Horizon Editor' },
    });
  }

  const categories = await prisma.category.findMany();
  let tech = categories.find((c) => (c.name as { en?: string }).en === 'Technology');
  let life = categories.find((c) => (c.name as { en?: string }).en === 'Lifestyle');

  if (!tech) {
    tech = await prisma.category.create({
      data: {
        name: { en: 'Technology', ru: 'Технологии' },
        slug: { en: 'technology', ru: 'tehnologii' },
      },
    });
  }
  if (!life) {
    life = await prisma.category.create({
      data: {
        name: { en: 'Lifestyle', ru: 'Образ жизни' },
        slug: { en: 'lifestyle', ru: 'obraz-zhizni' },
      },
    });
  }

  const tags = await prisma.tag.findMany();
  let intro = tags.find((t) => (t.name as { en?: string }).en === 'Introduction');
  if (!intro) {
    intro = await prisma.tag.create({
      data: {
        name: { en: 'Introduction', ru: 'Введение' },
        slug: { en: 'introduction', ru: 'vvedenie' },
      },
    });
  }

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM articles
    WHERE deleted_at IS NULL AND slug->>'en' = 'welcome-to-my-blog'
    LIMIT 1
  `;

  if (existing.length === 0) {
    await prisma.article.create({
      data: {
        title: {
          en: 'Welcome to My Blog',
          ru: 'Добро пожаловать в мой блог',
        },
        slug: {
          en: 'welcome-to-my-blog',
          ru: 'dobro-pozhalovat-v-moy-blog',
        },
        excerpt: {
          en: 'A short introduction to this personal blog platform.',
          ru: 'Краткое введение в эту платформу личного блога.',
        },
        content: {
          en: '<p>This is your first published article. Edit it from the admin panel or create new posts with English and Russian content.</p>',
          ru: '<p>Это ваша первая опубликованная статья. Отредактируйте её в админ-панели или создайте новые посты на английском и русском.</p>',
        },
        status: 'published',
        featured: true,
        publishedAt: new Date(),
        authorId: admin.id,
        categories: {
          create: [{ categoryId: tech.id }],
        },
        tags: {
          create: [{ tagId: intro.id }],
        },
      },
    });
  } else {
    await prisma.article.update({
      where: { id: existing[0].id },
      data: { featured: true },
    });
  }

  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.create({
      data: {
        title: 'Sidebar Promo',
        imageUrl: 'https://placehold.co/300x250/1a365d/white?text=Ad',
        linkUrl: 'https://example.com',
        position: 'sidebar',
        isActive: true,
      },
    });
  }

  console.log(`Seeded admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
