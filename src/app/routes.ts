import { createBrowserRouter } from 'react-router';
import { RootShell } from './components/RootShell';
import { RouteErrorBoundary } from './components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/explore',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/events',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/events/:eventId',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/editorial',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/notifications',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/profile',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/profile/:userId',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/article/:articleId',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/post/:postId',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/reel/:reelId',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/reels/:reelId',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/me/security',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '*',
    Component: RootShell,
    ErrorBoundary: RouteErrorBoundary,
  },
]);
