# 📘 Pagination Implementation Example - Complete Code

**Purpose**: Step-by-step guide untuk mengimplementasikan pagination di Admin Dashboard views  
**Target**: `AdminDashboard_Modern.tsx`

---

## 🚀 OPTION 1: Using Custom Hook (RECOMMENDED)

### Step 1: Import Dependencies

```typescript
// Di bagian atas AdminDashboard_Modern.tsx, tambahkan:
import Pagination from './Pagination';  // atau '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'; // OPTIONAL: jika mau pakai hook
```

### Step 2: Setup Pagination State (Manual Way)

```typescript
// Di dalam component (contoh: UserManagementView)
const UserManagementView = ({ onBack, onLogout }) => {
  // ✅ ADD: Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Existing state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ... rest of code
};
```

### Step 3: Update Fetch Function

```typescript
// BEFORE (No pagination)
const fetchUsers = useCallback(async () => {
  try {
    setLoading(true);
    const response = await apiCall('/api/admin/guru', {}, onLogout);
    if (response.data) {
      setUsers(response.data);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
}, [onLogout]);

// AFTER (With pagination) ✅
const fetchUsers = useCallback(async () => {
  try {
    setLoading(true);
    
    // ✅ ADD: Include page, limit, and search in URL
    const url = `/api/admin/guru?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`;
    const response = await apiCall(url, {}, onLogout);
    
    if (response.data) {
      setUsers(response.data);
      
      // ✅ ADD: Extract pagination metadata from response
      if (response.pagination) {
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.total_pages);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    toast({ title: "Error", description: "Gagal memuat data" });
  } finally {
    setLoading(false);
  }
}, [currentPage, itemsPerPage, searchTerm, onLogout]); // ✅ ADD dependencies
```

### Step 4: Update useEffect

```typescript
// BEFORE
useEffect(() => {
  fetchUsers();
}, [fetchUsers]);

// AFTER ✅ (same, but fetchUsers dependencies changed)
useEffect(() => {
  fetchUsers();
}, [fetchUsers]); // Will re-run when currentPage, itemsPerPage, or searchTerm changes
```

### Step 5: Reset Page on Search

```typescript
// ✅ ADD: Reset to page 1 when search changes
const handleSearch = (term: string) => {
  setSearchTerm(term);
  setCurrentPage(1); // ⚠️ IMPORTANT!
};
```

### Step 6: Add Pagination Component to JSX

```typescript
return (
  <Card>
    <CardHeader>
      <CardTitle>Daftar Akun Guru</CardTitle>
      
      {/* Search input */}
      <div className="flex gap-2">
        <Input
          placeholder="Cari guru..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
    </CardHeader>
    
    <CardContent>
      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell>{user.nama}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {/* Actions */}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* ✅ ADD: Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
        onItemsPerPageChange={(limit) => {
          setItemsPerPage(limit);
          setCurrentPage(1); // Reset to page 1 when changing per-page
        }}
        showItemsPerPage={true}
        className="mt-4"
      />
    </CardContent>
  </Card>
);
```

---

## 🎯 OPTION 2: Using usePagination Hook (ADVANCED)

### Step 1: Import Hook

```typescript
import { usePagination } from '@/hooks/usePagination';
```

### Step 2: Setup Pagination with Hook

```typescript
const UserManagementView = ({ onBack, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ Use pagination hook
  const {
    data: users,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    refreshData,
    PaginationComponent
  } = usePagination({
    fetchFunction: async (page, limit, search) => {
      const url = `/api/admin/guru?page=${page}&limit=${limit}&search=${search}`;
      const response = await apiCall(url, {}, onLogout);
      return response; // Should return { data: [...], pagination: {...} }
    },
    initialPage: 1,
    initialLimit: 20,
    searchTerm: searchTerm,
    dependencies: [] // Additional dependencies if needed
  });
  
  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term); // Hook will auto-reset to page 1
  };
  
  // ... rest of component
};
```

### Step 3: Use in JSX (Simplified)

```typescript
return (
  <Card>
    <CardHeader>
      <CardTitle>Daftar Akun Guru</CardTitle>
      <Input
        placeholder="Cari guru..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </CardHeader>
    
    <CardContent>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <>
          <Table>
            {/* Table content */}
          </Table>
          
          {/* ✅ Pagination Component from hook */}
          <PaginationComponent className="mt-4" />
        </>
      )}
    </CardContent>
  </Card>
);
```

---

## 📝 COMPLETE EXAMPLE: SiswaManagementView

```typescript
const SiswaManagementView = ({ onBack, onLogout }) => {
  // State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // ✅ Fetch students with pagination
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      
      const url = `/api/admin/siswa?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`;
      const response = await apiCall(url, {}, onLogout);
      
      if (response.data) {
        setStudents(response.data);
        
        if (response.pagination) {
          setTotalItems(response.pagination.total);
          setTotalPages(response.pagination.total_pages);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({ 
        title: "Error", 
        description: "Gagal memuat data siswa",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, onLogout]);
  
  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  
  // ✅ Reset to page 1 on search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };
  
  // Handlers for CRUD operations
  const handleCreate = async (data) => {
    try {
      await apiCall('/api/admin/siswa', {
        method: 'POST',
        body: JSON.stringify(data)
      }, onLogout);
      
      toast({ title: "Berhasil", description: "Siswa berhasil ditambahkan" });
      setIsDialogOpen(false);
      fetchStudents(); // Refresh data
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  const handleUpdate = async (id, data) => {
    try {
      await apiCall(`/api/admin/siswa/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }, onLogout);
      
      toast({ title: "Berhasil", description: "Data siswa berhasil diupdate" });
      setIsDialogOpen(false);
      fetchStudents(); // Refresh data
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return;
    
    try {
      await apiCall(`/api/admin/siswa/${id}`, {
        method: 'DELETE'
      }, onLogout);
      
      toast({ title: "Berhasil", description: "Siswa berhasil dihapus" });
      fetchStudents(); // Refresh data
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h2 className="text-2xl font-bold">Data Siswa</h2>
        </div>
        
        <Button onClick={() => {
          setSelectedStudent(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Siswa
        </Button>
      </div>
      
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Cari siswa (nama, NIS, kelas)..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-md"
            />
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data siswa
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id_siswa}>
                      <TableCell>{student.nis}</TableCell>
                      <TableCell className="font-medium">{student.nama}</TableCell>
                      <TableCell>{student.nama_kelas}</TableCell>
                      <TableCell>{student.username}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'aktif' ? 'default' : 'secondary'}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(student.id_siswa)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* ✅ Pagination Component */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
                onItemsPerPageChange={(limit) => {
                  setItemsPerPage(limit);
                  setCurrentPage(1);
                }}
                showItemsPerPage={true}
                className="mt-4"
              />
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* Dialog content */}
      </Dialog>
    </div>
  );
};
```

---

## ✅ CHECKLIST untuk Setiap View

Saat mengimplementasikan pagination di view baru, ikuti checklist ini:

- [ ] Import `Pagination` component
- [ ] Add pagination state (`currentPage`, `itemsPerPage`, `totalItems`, `totalPages`)
- [ ] Update `fetchData` function to include `page`, `limit`, `search` in URL
- [ ] Update `fetchData` dependencies to include pagination state
- [ ] Extract pagination metadata from response
- [ ] Add `handleSearch` function that resets `currentPage` to 1
- [ ] Add `<Pagination>` component in JSX
- [ ] Connect `onPageChange` handler
- [ ] Connect `onItemsPerPageChange` handler
- [ ] Test with different page sizes (10, 20, 50, 100)
- [ ] Test search functionality (should reset to page 1)
- [ ] Test edge cases (empty results, single page, large dataset)

---

## 🎯 VIEWS YANG PERLU DIUPDATE

### Priority 1 (CRITICAL - 1000+ records):
1. ✅ **SiswaManagementView** - Example lengkap di atas
2. 🔄 **StudentAccountManagementView** - Same pattern

### Priority 2 (HIGH - 100+ records):
3. 🔄 **UserManagementView** (Daftar Akun Guru)
4. 🔄 **GuruManagementView** (Data Guru)

---

**Status**: ✅ **READY TO IMPLEMENT**  
**Estimated Time**: 15-20 minutes per view  
**Total**: ~1 hour for all 4 critical views


