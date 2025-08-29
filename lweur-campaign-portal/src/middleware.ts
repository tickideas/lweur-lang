import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Check if user is accessing admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // Allow access to login page
      if (req.nextUrl.pathname === '/admin/login') {
        return NextResponse.next();
      }
      
      // Check if user has admin role
      const token = req.nextauth.token;
      if (!token || !token.role) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
      
      // Check role-based access
      const userRole = token.role as string;
      const allowedRoles = ['SUPER_ADMIN', 'CAMPAIGN_MANAGER', 'FINANCE', 'VIEWER'];
      
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without token
        if (req.nextUrl.pathname === '/admin/login') {
          return true;
        }
        
        // For admin routes, require valid token
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token;
        }
        
        // Allow access to public routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};"