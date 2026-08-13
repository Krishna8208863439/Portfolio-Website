import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Project } from '@/lib/models';
import { verifyAdminToken } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    await connectToDatabase();

    const updatedProject = await Project.findByIdAndUpdate(id, body, { new: true });
    if (!updatedProject) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: updatedProject }, { status: 200 });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ message: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await connectToDatabase();

    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Project deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ message: 'Failed to delete project' }, { status: 500 });
  }
}
