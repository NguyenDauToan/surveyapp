import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, Eye, Edit, Trash2, Plus, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
    id: string;
    type: 'text' | 'multiple-choice' | 'rating' | 'yes-no';
    title: string;
    required: boolean;
    choices?: string[];
}
interface User {
    id: string;
    ten: string;
    email: string;
    vai_tro: boolean;
    ngay_tao: string;
}
interface Survey {
    id: string;
    title: string;
    description: string;
    questions: Question[];
    createdAt: string;
    status: 'draft' | 'active' | 'closed';
    responses: number;
}

const Admin = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
    const { toast } = useToast();
    const [openSurveyId, setOpenSurveyId] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const API_BASE = import.meta.env.API_BASE;

    useEffect(() => {
        loadSurveys();
        loadUsers();

    }, []);
    const loadUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Bạn chưa đăng nhập");

            const res = await fetch(`${API_BASE}/api/admin/users`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) throw new Error("Fetch error");

            const data = await res.json();
            console.log("Danh sách user:", data); // ✅ check log

            setUsers(data.users || []);
        } catch (error) {
            console.error(error);
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách người dùng",
                variant: "destructive",
            });
        }
    };


    const loadSurveys = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/forms`);
            if (!res.ok) throw new Error('Fetch error');
            const data = await res.json();

            // ✅ Lấy danh sách forms từ data.forms
            const surveysWithStats: Survey[] = (data.forms || []).map((f: any) => ({
                id: f.id.toString(),
                title: f.title,
                description: f.description,
                questions: [], // sẽ load chi tiết khi mở dialog
                createdAt: f.created_at || f.NgayTao,
                status: (f.trang_thai as 'draft' | 'active' | 'closed') || 'draft',
                responses: f.responses || 0,
            }));

            setSurveys(surveysWithStats);
        } catch (error) {
            console.error(error);
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách khảo sát",
                variant: "destructive",
            });
        }
    };

    const openSurveyDetail = async (surveyId: string) => {
        try {
            const res = await fetch(`/api/forms/${surveyId}`);
            if (!res.ok) throw new Error('Fetch error');
            const data = await res.json();

            const survey = surveys.find(s => s.id === surveyId);
            if (!survey) return;

            setSelectedSurvey({
                ...survey,
                questions: data.questions.map((q: any) => ({
                    id: q.id.toString(),
                    title: q.content,
                    type: q.type,
                    required: q.props?.required || false,
                    choices: q.options?.map((o: any) => o.noi_dung) || []
                }))
            });

            setOpenSurveyId(surveyId);
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tải chi tiết khảo sát",
                variant: "destructive"
            });
        }
    };

    const deleteSurvey = (surveyId: string) => {
        try {
            const updatedSurveys = surveys.filter(survey => survey.id !== surveyId);
            setSurveys(updatedSurveys);

            toast({
                title: "Thành công",
                description: "Đã xóa khảo sát"
            });
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xóa khảo sát",
                variant: "destructive"
            });
        }
    };

    const toggleSurveyStatus = (surveyId: string) => {
        const updatedSurveys = surveys.map(survey => {
            if (survey.id === surveyId) {
                const newStatus: 'draft' | 'active' | 'closed' = survey.status === 'active' ? 'closed' : 'active';
                return { ...survey, status: newStatus };
            }
            return survey;
        });
        setSurveys(updatedSurveys);

        toast({
            title: "Thành công",
            description: "Đã cập nhật trạng thái khảo sát"
        });
    };

    const filteredSurveys = surveys.filter(survey =>
        survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        survey.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const variants = {
            draft: 'secondary',
            active: 'default',
            closed: 'destructive'
        };
        const labels = {
            draft: 'Nháp',
            active: 'Hoạt động',
            closed: 'Đã đóng'
        };
        return (
            <Badge variant={variants[status as keyof typeof variants] as any}>
                {labels[status as keyof typeof labels]}
            </Badge>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Quản lý Khảo sát</h1>
                            <p className="text-muted-foreground mt-2">
                                Quản lý tất cả khảo sát và xem thống kê
                            </p>
                        </div>
                        <Button
                            onClick={() => window.location.href = '/create'}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Tạo khảo sát mới
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {/* xuất file khảo sát */}
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Xuất file</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{surveys.length}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tổng khảo sát</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{surveys.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {surveys.filter(s => s.status === 'active').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tổng phản hồi</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {surveys.reduce((total, survey) => total + survey.responses, 0)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">85%</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and Filters */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Tìm kiếm và Lọc</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm khảo sát theo tiêu đề hoặc mô tả..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Surveys Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách Khảo sát</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {filteredSurveys.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        {searchTerm ? 'Không tìm thấy khảo sát nào.' : 'Chưa có khảo sát nào.'}
                                    </p>
                                </div>

                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tiêu đề</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                                <TableHead>Câu hỏi</TableHead>
                                                <TableHead>Phản hồi</TableHead>
                                                <TableHead>Ngày tạo</TableHead>
                                                <TableHead>Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSurveys.map((survey) => (
                                                <TableRow key={survey.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{survey.title}</div>
                                                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                                {survey.description}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <button onClick={() => toggleSurveyStatus(survey.id)}>
                                                            {getStatusBadge(survey.status)}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell>{selectedSurvey?.id === survey.id ? selectedSurvey.questions.length : '-'}</TableCell>
                                                    <TableCell>{survey.responses}</TableCell>
                                                    <TableCell>
                                                        {new Date(survey.createdAt).toLocaleDateString('vi-VN')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {/* Xem chi tiết */}
                                                            <Dialog open={openSurveyId === survey.id} onOpenChange={(open) => setOpenSurveyId(open ? survey.id : null)}>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="ghost" size="sm" onClick={() => openSurveyDetail(survey.id)}>
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                                    <DialogHeader>
                                                                        <DialogTitle>{survey.title}</DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4">
                                                                        <p className="text-muted-foreground">{survey.description}</p>
                                                                        <div>
                                                                            <h4 className="font-semibold mb-2">Câu hỏi:</h4>
                                                                            <div className="space-y-3">
                                                                                {selectedSurvey?.questions.map((question, index) => (
                                                                                    <div key={question.id} className="p-3 border rounded-lg">
                                                                                        <div className="flex items-start justify-between">
                                                                                            <div className="flex-1">
                                                                                                <p className="font-medium">{index + 1}. {question.title}</p>
                                                                                                <div className="flex items-center gap-2 mt-1">
                                                                                                    <Badge variant="outline">
                                                                                                        {question.type === 'text' && 'Văn bản'}
                                                                                                        {question.type === 'multiple-choice' && 'Trắc nghiệm'}
                                                                                                        {question.type === 'rating' && 'Đánh giá'}
                                                                                                        {question.type === 'yes-no' && 'Có/Không'}
                                                                                                    </Badge>
                                                                                                    {question.required && <Badge variant="destructive">Bắt buộc</Badge>}
                                                                                                </div>
                                                                                                {question.choices?.length > 0 && (
                                                                                                    <div className="mt-2">
                                                                                                        <p className="text-sm text-muted-foreground">Lựa chọn:</p>
                                                                                                        <ul className="text-sm mt-1">
                                                                                                            {question.choices.map((choice, i) => (
                                                                                                                <li key={i} className="ml-4">• {choice}</li>
                                                                                                            ))}
                                                                                                        </ul>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>

                                                            {/* Edit */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => window.location.href = `/edit/${survey.id}`}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>

                                                            {/* Delete */}
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="sm">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Bạn có chắc chắn muốn xóa khảo sát "{survey.title}"?
                                                                            Hành động này không thể hoàn tác.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteSurvey(survey.id)}
                                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                        >
                                                                            Xóa
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>Danh sách Người dùng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tên</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Vai trò</TableHead>
                                            <TableHead>Ngày tạo</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length > 0 ? (
                                            users.map(user => (
                                                <TableRow key={user.id}>
                                                    <TableCell>{user.ten}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        {user.vai_tro ? (
                                                            <Badge variant="destructive">Admin</Badge>
                                                        ) : (
                                                            <Badge>User</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.ngay_tao
                                                            ? new Date(user.ngay_tao).toLocaleDateString("vi-VN")
                                                            : "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                                                    Không có người dùng nào
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Admin;
