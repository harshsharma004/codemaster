import { Request, Response } from 'express';
import 'express-session';
import { prisma } from '../db';
import { env } from '../config/env';
import * as bcrypt from 'bcrypt';
import { adminLoginTemplate, adminHomeTemplate, renderTemplate } from '../utils/admin.templates';

export const adminRoot = (req: Request, res: Response) => {
  res.redirect('/admin/');
};

export const adminLoginPage = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderTemplate(adminLoginTemplate, { Error: '' }));
};

export const adminLogin = async (req: Request, res: Response) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).send(renderTemplate(adminLoginTemplate, { Error: 'Email and password are required.' }));
    return;
  }

  const adminEmails = env.CodeMaster_ADMIN_EMAILS.split(',').map((e: string) => e.trim().toLowerCase());
  if (!adminEmails.includes(email)) {
    res.status(400).send(renderTemplate(adminLoginTemplate, { Error: 'Invalid email or password.' }));
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    res.status(400).send(renderTemplate(adminLoginTemplate, { Error: 'Invalid email or password.' }));
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(400).send(renderTemplate(adminLoginTemplate, { Error: 'Invalid email or password.' }));
    return;
  }

  (req.session as any).admin_email = user.email;
  res.redirect('/admin/');
};

export const adminLogout = (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
};

export const adminHome = async (req: Request, res: Response) => {
  const email = (req.session as any).admin_email;
  
  const resources = [
    { label: 'Users', table: 'user' },
    { label: 'Friendships', table: 'friendship' },
    { label: 'Groups', table: 'group' },
    { label: 'Group Memberships', table: 'groupMembership' },
    { label: 'Problem Shares', table: 'problemShare' },
    { label: 'Join Requests', table: 'joinRequest' },
    { label: 'Challenges', table: 'challenge' },
    { label: 'Challenge Participants', table: 'challengeParticipant' },
    { label: 'Challenge Problems', table: 'challengeProblem' },
  ];

  let resourcesHtml = '';
  for (const r of resources) {
    const count = await (prisma as any)[r.table].count();
    resourcesHtml += `
      <article class="card">
        <a href="#">
          <div class="muted">${r.label}</div>
          <div class="count">${count}</div>
          <div class="muted">Open resource</div>
        </a>
      </article>
    `;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(renderTemplate(adminHomeTemplate, { Email: email, Resources: resourcesHtml }));
};

export const requireAdminSession = (req: Request, res: Response, next: any) => {
  const email = (req.session as any).admin_email;
  if (!email) {
    return res.redirect('/admin/login');
  }

  const adminEmails = env.CodeMaster_ADMIN_EMAILS.split(',').map((e: string) => e.trim().toLowerCase());
  if (!adminEmails.includes(email.toLowerCase())) {
    return res.redirect('/admin/login');
  }

  next();
};
