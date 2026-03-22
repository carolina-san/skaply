import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../../services/api.service';
import { AuthService, User } from '../../../services/auth.service';
import { FilterOptions } from '../../../types';
import { Pagination } from '../pagination/pagination';
import { SortButton } from '../../UI/sort-button/sort-button';

interface ProviderReview {
  id: number;
  furniture_id: number;
  furniture_name: string;
  furniture_image_url?: string;
  provider_id: number;
  stars: number;
  text: string;
  created_at: string;
}

interface FurnitureOption {
  id: number;
  name: string;
}

interface ProviderOption {
  id: number;
  name: string;
}

@Component({
  standalone: true,
  selector: 'app-reviews',
  imports: [CommonModule, FormsModule, Pagination, SortButton],
  templateUrl: './reviews.html',
  styleUrl: './reviews.css'
})
export class Reviews implements OnInit, OnChanges {
  @Input() searchText: string = '';

  currentUser: User | null = null;
  reviews: ProviderReview[] = [];
  filteredReviews: ProviderReview[] = [];
  paginatedReviews: ProviderReview[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalItems: number = 0;

  furnitureOptions: FurnitureOption[] = [];
  selectedFurnitureId: number | null = null;
  providerOptions: ProviderOption[] = [];
  selectedProviderId: number | null = null;
  orderBy: string = '';
  orderDir: string = '';

  isLoading: boolean = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.role === 'provider' || user?.role === 'admin') {
        this.fetchReviews();
      } else {
        this.reviews = [];
        this.furnitureOptions = [];
        this.applySearchAndPagination();
      }
    });
  }

  ngOnInit() {
    if (this.currentUser?.role === 'provider' || this.currentUser?.role === 'admin') {
      this.fetchReviews();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText']) {
      this.currentPage = 1;
      this.applySearchAndPagination();
    }
  }

  fetchReviews() {
    if (!this.currentUser?.id) return;

    this.isLoading = true;

    const filters: FilterOptions = {};

    if (this.currentUser.role === 'provider') {
      filters.provider_ids = [this.currentUser.id];
    }

    const furnitureRequest = this.apiService.getAllFilteredFurniture(filters);
    const providerRequest = this.currentUser.role === 'admin' 
      ? this.apiService.getProviders(1, 1000, '') 
      : of({ data: [] });

    forkJoin([furnitureRequest, providerRequest]).subscribe({
      next: ([furnitureResponse, providerResponse]) => {
        const providerFurniture = furnitureResponse.data || [];
        const providers = providerResponse.data || [];

        this.furnitureOptions = providerFurniture.map((furniture: any) => ({
          id: furniture.id,
          name: furniture.name
        }));

        if (this.currentUser?.role === 'admin') {
          this.providerOptions = providers.map((provider: any) => ({
            id: provider.id,
            name: provider.company_name
          }));
        }

        if (providerFurniture.length === 0) {
          this.reviews = [];
          this.isLoading = false;
          this.applySearchAndPagination();
          return;
        }

        const reviewRequests: Observable<ProviderReview[]>[] = providerFurniture.map((furniture: any) =>
          this.apiService.getFurnitureReviews(furniture.id).pipe(
            map((reviewsResponse) => {
              const reviews = reviewsResponse?.data || [];
              return reviews.map((review: any) => ({
                id: review.id,
                furniture_id: furniture.id,
                furniture_name: furniture.name,
                furniture_image_url: furniture.image_url,
                provider_id: furniture.provider_id,
                stars: review.stars,
                text: review.text || '',
                created_at: review.created_at
                  ? new Date(review.created_at).toISOString()
                  : review.date
                    ? new Date(review.date).toISOString()
                    : ''
              } as ProviderReview));
            }),
            catchError(() => of([] as ProviderReview[]))
          )
        );

        forkJoin(reviewRequests).subscribe({
          next: (reviewsByFurniture: ProviderReview[][]) => {
            this.reviews = reviewsByFurniture
              .flat()
              .sort((a: ProviderReview, b: ProviderReview) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            this.isLoading = false;
            this.applySearchAndPagination();
          },
          error: () => {
            this.reviews = [];
            this.isLoading = false;
            this.applySearchAndPagination();
          }
        });
      },
      error: () => {
        this.reviews = [];
        this.isLoading = false;
        this.applySearchAndPagination();
      }
    });
  }

  applySearchAndPagination() {
    const search = this.searchText.trim().toLowerCase();
    let reviewsToProcess = [...this.reviews];

    if (this.selectedFurnitureId !== null) {
      reviewsToProcess = reviewsToProcess.filter(review => review.furniture_id === this.selectedFurnitureId);
    }

    if (this.selectedProviderId !== null) {
      reviewsToProcess = reviewsToProcess.filter(review => review.provider_id === this.selectedProviderId);
    }

    if (!search) {
      this.filteredReviews = [...reviewsToProcess];
    } else {
      this.filteredReviews = reviewsToProcess.filter(review => {
        const createdAt = review.created_at ? new Date(review.created_at).toLocaleDateString('es-ES') : '';
        return (
          review.furniture_name.toLowerCase().includes(search) ||
          review.text.toLowerCase().includes(search) ||
          `${review.stars}`.includes(search) ||
          createdAt.includes(search)
        );
      });
    }

    if (this.orderDir && this.orderBy) {
      const direction = this.orderDir === 'ASC' ? 1 : -1;

      if (this.orderBy === 'stars') {
        this.filteredReviews.sort((a, b) => {
          if (a.stars === b.stars) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return (a.stars - b.stars) * direction;
        });
      }

      if (this.orderBy === 'created_at') {
        this.filteredReviews.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return (dateA - dateB) * direction;
        });
      }
    }

    this.totalItems = this.filteredReviews.length;

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedReviews = this.filteredReviews.slice(start, end);
  }

  goToPage(page: number) {
    const totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.applySearchAndPagination();
    }
  }

  onFurnitureChange() {
    if (this.selectedFurnitureId !== null) {
      this.selectedFurnitureId = Number(this.selectedFurnitureId);
      if (Number.isNaN(this.selectedFurnitureId)) {
        this.selectedFurnitureId = null;
      }
    }
    this.currentPage = 1;
    this.applySearchAndPagination();
  }

  onProviderChange() {
    if (this.selectedProviderId !== null) {
      this.selectedProviderId = Number(this.selectedProviderId);
      if (Number.isNaN(this.selectedProviderId)) {
        this.selectedProviderId = null;
      }
    }
    this.currentPage = 1;
    this.applySearchAndPagination();
  }

  onOrderByChange(column: string) {
    if (this.orderBy === column) {
      if (this.orderDir === 'ASC') {
        this.orderDir = 'DESC';
      } else if (this.orderDir === 'DESC') {
        this.orderBy = '';
        this.orderDir = '';
      } else {
        this.orderDir = 'ASC';
      }
    } else {
      this.orderBy = column;
      this.orderDir = 'ASC';
    }
    this.currentPage = 1;
    this.applySearchAndPagination();
  }

  getStarIcons(stars: number): boolean[] {
    return Array.from({ length: 5 }, (_, index) => index < stars);
  }
}
