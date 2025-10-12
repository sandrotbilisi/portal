# Folder Permissions System

## Overview
This document describes the comprehensive folder permissions system implemented for the file management portal. The system allows administrators to set granular access controls on folders based on user roles and branch assignments.

## Features

### 1. Permission Types
The system supports four types of permissions that can be set per folder (including root):
- **View**: Can see the folder and its contents
- **Upload**: Can upload files to the folder
- **Delete**: Can delete files from the folder
- **Rename**: Can rename files in the folder

**Root Directory**: You can configure permissions for the root directory to control default access to files and folders that don't have specific permissions set.

### 2. Permission Levels

#### Role-Based Permissions
- Permissions can be set for the "user" role (non-admins)
- Admins always have full access to all folders
- Each permission type can be enabled or disabled for users

#### Branch-Based Permissions
- Permissions can be set per branch
- Each branch can have different access levels to the same folder
- Allows for office/department-specific access control

### 3. Permission Inheritance
- Parent folder permissions affect access to nested folders
- If a user cannot view a parent folder, they cannot access its subfolders
- Permissions cascade down the folder hierarchy

## Backend Implementation

### Database
- Permissions are stored in `permissions.json`
- Each permission entry contains:
  - `id`: Unique identifier
  - `folderPath`: Path to the folder
  - `roleRestrictions`: Object defining role-based permissions
  - `branchRestrictions`: Object defining branch-based permissions
  - `createdAt`: Timestamp of creation
  - `updatedAt`: Timestamp of last update

### API Endpoints

#### Get All Permissions
```
GET /permissions
Admin only
Returns: Array of all permission objects
```

#### Get Permission for Specific Folder
```
GET /permissions/:folderPath
Admin only
Returns: Permission object for the specified folder or null
```

#### Create/Update Permission
```
POST /permissions
Admin only
Body: {
  folderPath: string,
  roleRestrictions: object,
  branchRestrictions: object
}
Returns: Created/updated permission object
```

#### Delete Permission
```
DELETE /permissions/:folderPath
Admin only
Returns: Success message
```

### Permission Checking

The backend implements several helper functions:

1. **checkFolderPermission(folderPath, userId, action)**
   - Checks if a user has a specific permission on a folder
   - Admins always return true
   - Returns true if no restrictions are set (default allow)

2. **canViewFolder(folderPath, userId)**
   - Checks view permission including all parent folders
   - Ensures users can only access folders they should see

3. **filterFoldersbyPermissions(folders, currentPath, userId)**
   - Filters folder lists based on user permissions
   - Used in folder listing endpoints

### Protected Operations

All file operations now check permissions:
- **Folder Listing**: Automatically filters based on view permissions
- **File Upload**: Checks upload permission before allowing
- **File Delete**: Checks delete permission before allowing
- **File Rename**: Checks rename permission before allowing

## Frontend Implementation

### Admin Interface

#### Permissions Modal
Located at: `frontend/src/components/modals/PermissionsModal.tsx`

Features:
- Visual interface for managing folder permissions
- Separate sections for role and branch permissions
- Checkbox controls for each permission type
- Ability to remove all permissions from a folder
- Auto-refresh after changes

**Productivity Features** (NEW!):
- **Quick Presets**: One-click buttons for "Full Access", "Read Only", and "No Access"
- **Bulk Branch Selection**: Select multiple branches and apply permissions to all at once
- **Select All**: Quickly select or deselect all branches
- **Collapsible Sections**: Hide/show branch list to reduce clutter
- **Visual Feedback**: See how many branches are selected with a badge
- **Scrollable List**: Long branch lists scroll independently

#### Access
- Admins see a "Permissions" button in the folder action menu
- Only available for folders (not files)
- Click opens the permissions modal for that folder

### User Interface
- Users only see folders they have view permission for
- Backend filters all folder listings automatically
- Download functionality respects permissions
- No access to admin controls

### Types
Permission-related TypeScript interfaces in `frontend/src/types/index.ts`:
- `FolderPermissions`: Permission flags for a folder
- `RoleRestrictions`: Role-based permission structure
- `BranchRestrictions`: Branch-based permission structure
- `Permission`: Complete permission object
- `Branch`: Branch information

## Usage Examples

### Important: New Folder Default Behavior
**When you create a new folder, it automatically gets read-only permissions for users:**
- ✅ View: Enabled (users can see and browse the folder)
- ❌ Upload: Disabled (users cannot upload files)
- ❌ Delete: Disabled (users cannot delete files)
- ❌ Rename: Disabled (users cannot rename files)

**To change this**: Click the folder's three-dot menu → Permissions → Modify as needed

### Example 1: Create a Folder with Full User Access
1. Create a new folder (gets read-only by default)
2. Click the three-dot menu on the new folder
3. Select "Permissions"
4. Click **"Full Access"** preset button (quick!)
5. Click "Save Permissions"

Result: Users now have full access to upload, delete, and rename in this folder.

### Example 2: Restrict Specific Branch from Viewing a Folder
1. Create or open permissions for the folder
2. In the "Branch Permissions" section:
   - Select the branch you want to restrict
   - Click **"No Access"** preset button
3. Click "Save Permissions"

Result: Users from that branch cannot see this folder or its contents at all.

### Example 3: Create Finance-Only Folder (Fast Method!)
1. Create a new folder named "Finance Documents" (auto-created as read-only)
2. Open permissions for the folder
3. Click **"No Access"** preset for User Role (blocks all users)
4. Select the Finance branch in Branch Permissions
5. Click **"Full Access"** preset for selected branch
6. Click "Save Permissions"

Result: Only Finance branch users can access this folder. **Total time: ~10 seconds!**

### Example 4: Keep Default Read-Only
1. Create a new folder
2. Don't change permissions at all!

Result: Users can view and download files but cannot upload/delete/rename. Perfect for shared archives!

### Example 5: Configure Root Directory Permissions
1. In the admin dashboard, make sure you're at the root level (no folder path shown)
2. Click the **"Root Permissions"** button (purple button in the controls area)
3. Use presets or manually set permissions:
   - Click **"Read Only"** to prevent users from uploading to root
   - Or manually uncheck "Upload" to keep root organized
4. Click "Save Permissions"

Result: Users can browse the root directory but cannot upload files directly to it. Keeps root clean!

### Example 6: Bulk Configure Multiple Branches (Ultra Fast! ⚡)
**Scenario**: You have 10 branches and want 7 of them to have read-only access, 2 to have full access, and 1 to have no access.

**Old Way** (Slow): Configure each branch individually (40+ clicks, 5 minutes)

**New Way** (Fast):
1. Create the folder (auto-created as read-only for all users)
2. Open permissions for the folder
3. **Configure branches in bulk**:
   - Click "Select All" (10 branches selected)
   - Click "Read Only" (all 10 branches now read-only) ✅
   - Deselect the 7 branches you want to keep read-only
   - With 3 branches selected (Finance, Legal, Management):
     - Deselect Management
     - Click "Full Access" (Finance, Legal now have full access) ✅
   - Select only Management
   - Click "No Access" (Management blocked) ✅
4. Click "Save Permissions"

Result: **Configured 10 branches in under 20 seconds!** 🚀

### Example 7: Using Quick Presets for User Role
1. Open folder permissions
2. Instead of checking individual boxes, click one of:
   - **"Full Access"**: Enables all permissions (view, upload, delete, rename)
   - **"Read Only"**: Only view enabled, others disabled
   - **"No Access"**: All permissions disabled
3. Click "Save Permissions"

Result: Configure user role permissions in 1 click instead of 4!

## Productivity Tips

### Working with Many Branches
1. **Start with "Select All"**: Select all branches first, then apply a preset
2. **Deselect Exceptions**: Uncheck branches that need different permissions
3. **Apply Different Preset**: Apply different permissions to the exceptions
4. **Use Collapse**: Click the arrow to hide/show branch list and reduce scrolling

### Quick Workflow Example
```
Goal: Most branches read-only, except Finance gets full access

Steps:
1. Select All (10 branches selected)
2. Click "Read Only" (all branches now read-only)
3. Deselect Finance branch
4. Select only Finance branch
5. Click "Full Access" (Finance now has full access)
6. Save

Total time: ~15 seconds for 10 branches!
```

## Security Considerations

1. **Admin Override**: Admins always have full access regardless of permissions
2. **Secure by Default**: When admins create new folders, they automatically have **read-only** permissions for users
   - Users can view and download files
   - Users cannot upload, delete, or rename
   - Admins can modify these permissions anytime
3. **Default Allow for Existing**: If no permissions are set (legacy folders), access is allowed (backward compatible)
4. **Cascading**: Parent folder restrictions prevent access to subfolders
5. **Server-Side Enforcement**: All permission checks happen on the backend
6. **Authentication Required**: All operations require valid authentication

## Migration

The system is backward compatible:
- Existing folders without permissions remain fully accessible
- No migration needed for existing setups
- Permissions can be added incrementally as needed

## Troubleshooting

### Users Can't See Expected Folders
1. Check if permissions are set on parent folders
2. Verify the user's branch assignment
3. Check role-based restrictions

### Permission Changes Not Reflecting
1. Users should refresh their browser after permission changes
2. Check if the permission was saved successfully (admin should see success message)
3. Verify the correct folder path was used

### Accidental Lockout
1. Admins always have access to reset permissions
2. Use the "Remove All Permissions" button to reset folder to default
3. Check the permissions.json file directly if needed

## Future Enhancements

Possible future improvements:
- User-specific permissions (not just role/branch)
- Permission templates for quick setup
- Bulk permission operations
- Permission inheritance toggles
- Audit log for permission changes
- Permission expiration dates

