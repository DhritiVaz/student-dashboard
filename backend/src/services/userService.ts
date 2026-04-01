import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

export async function updateProfile(
  userId: string,
  input: { name?: string; email?: string }
) {
  if (input.email?.trim()) {
    const email = input.email.trim().toLowerCase();
    const taken = await prisma.user.findFirst({
      where: { email, id: { not: userId }, deletedAt: null },
    });
    if (taken) throw new AppError("Email already in use", 409);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.email != null ? { email: input.email.trim().toLowerCase() } : {}),
    },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new AppError("User not found", 404);
  if (!user.password) {
    throw new AppError(
      "Password sign-in is not set for this account. Use Google or reset flow.",
      400
    );
  }
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError("Current password is incorrect", 401);
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}
