import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MapComponent } from './map/map.component';
import { UploadComponent } from './upload/upload.component';

const routes: Routes = [
  { path: 'index', component: MapComponent },
  { path: 'upload', component: UploadComponent },
  { path: '', redirectTo: '/index', pathMatch: 'full' },
];


@NgModule({
  declarations: [],

  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],

  exports: [
    RouterModule
  ],
})
export class AppRoutingModule { }
