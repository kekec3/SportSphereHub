import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { authGuard, roleGuard } from './guards/auth-guard';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { Register } from './pages/register/register';
import { Search } from './pages/search/search';
import { ObjectDetails } from './pages/object-details/object-details';
import { Profile } from './pages/profile/profile';
import { Teammates } from './pages/teammates/teammates';
import { Trainings } from './pages/trainings/trainings';
import { Shop } from './pages/shop/shop';
import { Statistics } from './pages/statistics/statistics';
import { MyObjects } from './pages/my-objects/my-objects';
import { ObjectManage } from './pages/object-manage/object-manage';
import { EmployeeReservations } from './pages/employee-reservations/employee-reservations';
import { EmployeePromotions } from './pages/employee-promotions/employee-promotions';
import { EmployeeEquipment } from './pages/employee-equipment/employee-equipment';
import { EmployeeCalendar } from './pages/employee-calendar/employee-calendar';
import { EmployeeReports } from './pages/employee-reports/employee-reports';
import { Admin } from './pages/admin/admin';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'search', component: Search },
    { path: 'objects/:id', component: ObjectDetails },
    { path: 'login', component: Login },
    { path: 'admin/login', component: Login },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'reset-password/:token', component: ResetPassword },
    { path: 'zaposleni', component: MyObjects, canActivate: [authGuard, roleGuard('zaposleni')] },
    { path: 'zaposleni/objekat/:id', component: ObjectManage, canActivate: [authGuard, roleGuard('zaposleni')] },
    { path: 'zaposleni/rezervacije', component: EmployeeReservations, canActivate: [authGuard, roleGuard('zaposleni')] },
    { path: 'zaposleni/promocije', component: EmployeePromotions, canActivate: [authGuard, roleGuard('zaposleni')] },
    { path: 'zaposleni/oprema', component: EmployeeEquipment, canActivate: [authGuard, roleGuard('zaposleni')] },
    { path: 'zaposleni/kalendar', component: EmployeeCalendar, canActivate: [authGuard, roleGuard('zaposleni')] },
    { path: 'zaposleni/izvestaji', component: EmployeeReports, canActivate: [authGuard, roleGuard('zaposleni')] },
    { path: 'admin', component: Admin, canActivate: [authGuard, roleGuard('admin')] },
    { path: 'register', component: Register },
    { path: 'profile', component: Profile, canActivate: [authGuard] },
    { path: 'teammates', component: Teammates, canActivate: [authGuard, roleGuard('sportista')] },
    { path: 'trainings', component: Trainings, canActivate: [authGuard, roleGuard('sportista')] },
    { path: 'shop', component: Shop, canActivate: [authGuard, roleGuard('sportista')] },
    { path: 'statistics', component: Statistics, canActivate: [authGuard, roleGuard('sportista')] },
    { path: '**', redirectTo: '' }
];
