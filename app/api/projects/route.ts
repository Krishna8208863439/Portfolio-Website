import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Project } from '@/lib/models';
import { verifyAdminToken } from '@/lib/auth';
import { PROJECTS_DATA } from '@/lib/constants';

const INITIAL_PROJECTS = PROJECTS_DATA.map((p) => ({
  title: p.title,
  subtitle: p.subtitle || '',
  description: p.description,
  longDescription: p.longDescription || p.description,
  category: p.category,
  tags: p.technologies || [],
  image: p.image,
  githubUrl: p.githubUrl || 'https://github.com/Krishna8208863439',
  liveUrl: p.liveUrl || 'https://github.com/Krishna8208863439',
  featured: p.featured ?? true,
}));

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(INITIAL_PROJECTS, { status: 200 });
    }

    let projects = await Project.find().sort({ createdAt: -1 }).lean();

    // Auto-seed or update if database has incomplete project list
    if (!projects || projects.length < INITIAL_PROJECTS.length) {
      await Project.deleteMany({});
      await Project.insertMany(INITIAL_PROJECTS);
      projects = await Project.find().sort({ createdAt: -1 }).lean();
    }

    return NextResponse.json(projects && projects.length > 0 ? projects : INITIAL_PROJECTS, { status: 200 });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(INITIAL_PROJECTS, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, subtitle, description, longDescription, category, image, tags, liveUrl, githubUrl, featured } = body;

    if (!title || !description || !image) {
      return NextResponse.json(
        { message: 'Title, description, and image URL are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const newProject = await Project.create({
      title,
      subtitle: subtitle || '',
      description,
      longDescription: longDescription || description,
      category: category || 'Full Stack',
      image,
      tags: Array.isArray(tags) ? tags : (tags || '').split(',').map((t: string) => t.trim()),
      liveUrl: liveUrl || '#',
      githubUrl: githubUrl || '#',
      featured: Boolean(featured),
    });

    return NextResponse.json({ success: true, project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ message: 'Failed to create project' }, { status: 500 });
  }
}
