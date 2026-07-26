import type { CollectionConfig } from "payload/types";
import { isAdmin, isAdminFieldLevel, isSignedIn } from "../access/roles";

const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "role"],
    group: "Administration",
  },
  access: {
    // Staff can see the user list; only admins can create/modify accounts.
    read: isSignedIn,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text" },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "viewer",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Viewer", value: "viewer" },
      ],
      access: {
        // Prevent privilege escalation: only admins can set roles.
        update: isAdminFieldLevel,
      },
    },
  ],
};

export default Users;
