import { Component } from '@angular/core';
import {Header } from '../../components/header/header';
import { Chatbot } from '../../components/chatbot/chatbot';
@Component({
  selector: 'app-home',
  imports: [Header, Chatbot],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

}
