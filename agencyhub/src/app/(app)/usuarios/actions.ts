"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";

export async function createUser(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const role = formData.get("role") as string;

  if (!name || !email || !password) {
    return { error: "Completa todos los campos obligatorios." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ya existe un usuario con ese correo." };
  }

  const supabase = await createServiceClient();
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return { error: authError?.message || "Error al crear usuario en auth." };
  }

  await prisma.user.create({
    data: {
      id: authData.user.id,
      name,
      email,
      role: role === "admin" ? "admin" : "editor",
    },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !isActive },
  });

  if (isActive) {
    const supabase = await createServiceClient();
    await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    });
  } else {
    const supabase = await createServiceClient();
    await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
  }

  revalidatePath("/usuarios");
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requireAdmin();

  if (newPassword.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createServiceClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
