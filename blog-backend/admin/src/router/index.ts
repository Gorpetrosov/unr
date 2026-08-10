import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/articles',
      name: 'articles',
      component: () => import('../views/ArticlesView.vue'),
    },
    {
      path: '/articles/new',
      name: 'article-new',
      component: () => import('../views/ArticleEditView.vue'),
    },
    {
      path: '/articles/:id',
      name: 'article-edit',
      component: () => import('../views/ArticleEditView.vue'),
    },
    {
      path: '/banners',
      name: 'banners',
      component: () => import('../views/BannersView.vue'),
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem('accessToken');
  if (!to.meta.public && !token) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.name === 'login' && token) {
    return { name: 'dashboard' };
  }
  return true;
});

export default router;
