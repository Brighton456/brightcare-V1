import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { safeSupabase as supabase } from "@/lib/safeSupabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Users, Clock, Activity, TrendingUp, Search, Filter, Calendar } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useHospital } from "@/contexts/HospitalContext";

interface StaffMember { id: string; first_name: string; last_name: string; role: string; department_id: string | null; staff_no: string; }
interface CheckinRecord { staff_id: string; check_in_time: string | null; check_out_time: string | null; date: string; }

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#8884d8", "#82ca9d", "#ffc658"];

export default function StaffWorkload() {
  const { hospitalId } = useHospital();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = format(subDays(new Date(), parseInt(dateRange)), "yyyy-MM-dd");
    Promise.all([
      supabase.from("staff").select("*").eq("hospital_id", hospitalId).eq("is_active", true),
      supabase.from("staff_checkins").select("*").eq("hospital_id", hospitalId).gte("date", from),
      supabase.from("consultations").select("doctor_id,status,created_at").eq("hospital_id", hospitalId).gte("created_at", from),
      supabase.from("lab_tests").select("performed_by,status,completed_at").eq("hospital_id", hospitalId).gte("requested_at", from),
      supabase.from("prescriptions").select("doctor_id,created_at").eq("hospital_id", hospitalId).gte("created_at", from),
    ]).then(([s, c, con, lt, pr]) => {
      if (s.data) setStaff(s.data);
      if (c.data) setCheckins(c.data as CheckinRecord[]);
      if (con.data) setConsultations(con.data);
      if (lt.data) setLabTests(lt.data);
      if (pr.data) setPrescriptions(pr.data);
      setLoading(false);
    });
  }, [dateRange]);

  const roles = [...new Set(staff.map(s => s.role))];
  const filtered = staff.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) && (roleFilter === "all" || s.role === roleFilter);
  });

  const getStaffMetrics = (staffId: string) => {
    const myCheckins = checkins.filter(c => c.staff_id === staffId);
    let totalHours = 0;
    myCheckins.forEach(c => {
      if (c.check_in_time && c.check_out_time) {
        totalHours += (new Date(c.check_out_time).getTime() - new Date(c.check_in_time).getTime()) / 3600000;
      }
    });
    const patientsConsulted = consultations.filter(c => c.doctor_id === staffId && c.status === "completed").length;
    const testsCompleted = labTests.filter(t => t.performed_by === staffId && t.status === "completed").length;
    const rxWritten = prescriptions.filter(p => p.doctor_id === staffId).length;
    const totalTasks = patientsConsulted + testsCompleted + rxWritten;
    return { totalHours: Math.round(totalHours * 10) / 10, patientsConsulted, testsCompleted, rxWritten, totalTasks, daysWorked: myCheckins.length };
  };

  const barData = filtered.slice(0, 15).map(s => {
    const m = getStaffMetrics(s.id);
    return { name: `${s.first_name} ${s.last_name.charAt(0)}.`, tasks: m.totalTasks, hours: m.totalHours, patients: m.patientsConsulted };
  });

  const roleDistribution = roles.map(r => ({ name: r, value: staff.filter(s => s.role === r).length }));

  const totalStaff = staff.length;
  const totalCheckins = checkins.length;
  const avgHours = staff.length > 0 ? Math.round(staff.reduce((sum, s) => sum + getStaffMetrics(s.id).totalHours, 0) / staff.length * 10) / 10 : 0;
  const totalTasks = staff.reduce((sum, s) => sum + getStaffMetrics(s.id).totalTasks, 0);

  return (
    <AppLayout title="Staff Workload Dashboard">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Staff", value: totalStaff, icon: Users, color: "text-primary" },
            { label: "Total Check-ins", value: totalCheckins, icon: Clock, color: "text-chart-2" },
            { label: "Avg Hours/Staff", value: `${avgHours}h`, icon: TrendingUp, color: "text-chart-3" },
            { label: "Total Tasks", value: totalTasks, icon: Activity, color: "text-chart-4" },
          ].map(m => (
            <Card key={m.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <m.icon className={`h-8 w-8 ${m.color}`} />
                <div><p className="text-2xl font-bold">{m.value}</p><p className="text-xs text-muted-foreground">{m.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Tasks by Staff Member</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Legend />
                  <Bar dataKey="tasks" fill="hsl(var(--primary))" name="Tasks" /><Bar dataKey="hours" fill="hsl(var(--chart-2))" name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Staff by Role</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart><Pie data={roleDistribution} cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${value})`} dataKey="value">
                  {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Staff Table */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Individual Performance ({filtered.length} staff)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="p-2">Staff</th><th className="p-2">Role</th><th className="p-2 text-center">Days</th>
                    <th className="p-2 text-center">Hours</th><th className="p-2 text-center">Patients</th>
                    <th className="p-2 text-center">Lab Tests</th><th className="p-2 text-center">Rx</th>
                    <th className="p-2 text-center">Total</th><th className="p-2">Load</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const m = getStaffMetrics(s.id);
                    const load = m.totalTasks > 20 ? "high" : m.totalTasks > 10 ? "medium" : "low";
                    return (
                      <tr key={s.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{s.first_name} {s.last_name}</td>
                        <td className="p-2"><Badge variant="outline" className="text-xs">{s.role}</Badge></td>
                        <td className="p-2 text-center">{m.daysWorked}</td>
                        <td className="p-2 text-center">{m.totalHours}</td>
                        <td className="p-2 text-center">{m.patientsConsulted}</td>
                        <td className="p-2 text-center">{m.testsCompleted}</td>
                        <td className="p-2 text-center">{m.rxWritten}</td>
                        <td className="p-2 text-center font-bold">{m.totalTasks}</td>
                        <td className="p-2">
                          <Badge variant={load === "high" ? "destructive" : load === "medium" ? "secondary" : "outline"} className="text-xs">
                            {load}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
