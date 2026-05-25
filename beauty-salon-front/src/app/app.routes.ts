import { Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { AgendamentoComponent } from './pages/agendamento/agendamento.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { PainelGestaoComponent } from './pages/painel-gestao/painel-gestao.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'agendamentos', component: AgendamentoComponent },
  { path: 'perfil', component: PerfilComponent },
  { path: 'login', component: AdminLoginComponent },
  { path: 'painel-gestao', component: PainelGestaoComponent },
];
