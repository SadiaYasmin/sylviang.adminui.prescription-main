import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BreadcrumbService } from '@app/@core/services';
import { ToastService } from '@core/services/misc/toast.service';
import { QuickAddService } from '@core/services/quick-add/quick-add.service';
import { ConfirmationService } from 'primeng/api';
import { of } from 'rxjs';
import { ManageQuickAddPresetComponent } from './manage-quick-add-preset.component';

describe('ManageQuickAddPresetComponent', () => {
  let component: ManageQuickAddPresetComponent;
  let fixture: ComponentFixture<ManageQuickAddPresetComponent>;
  let quickAddServiceSpy: jasmine.SpyObj<QuickAddService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let confirmationServiceSpy: jasmine.SpyObj<ConfirmationService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function configure(section: string, id: string | null): void {
    quickAddServiceSpy = jasmine.createSpyObj('QuickAddService', ['getList', 'add', 'update', 'getAdvicePhraseDictionary']);
    quickAddServiceSpy.getAdvicePhraseDictionary.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: { 'drink water.': 'পানি পান করুন।' } } as any));
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const breadcrumbSpy = jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']);

    TestBed.configureTestingModule({
      declarations: [ManageQuickAddPresetComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: QuickAddService, useValue: quickAddServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: BreadcrumbService, useValue: breadcrumbSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap(id ? { section, id } : { section })) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageQuickAddPresetComponent);
    component = fixture.componentInstance;
  }

  it('should build a medicine-shaped form for the medicine section', () => {
    configure('medicine', null);
    fixture.detectChanges();

    expect(component.form.contains('medicine')).toBeTrue();
    expect(component.form.contains('strength')).toBeTrue();
  });

  it('should build a bilingual-shaped form for the advice section and load its phrase dictionary', () => {
    configure('advice', null);
    fixture.detectChanges();

    expect(component.form.contains('en')).toBeTrue();
    expect(component.form.contains('bn')).toBeTrue();
    expect(quickAddServiceSpy.getAdvicePhraseDictionary).toHaveBeenCalled();
  });

  it('should not call getAdvicePhraseDictionary for non-bilingual sections', () => {
    configure('investigation', null);
    fixture.detectChanges();

    expect(quickAddServiceSpy.getAdvicePhraseDictionary).not.toHaveBeenCalled();
  });

  it('should not submit and should mark fields touched when the form is invalid', () => {
    configure('investigation', null);
    fixture.detectChanges();

    component.onSubmit();

    expect(quickAddServiceSpy.add).not.toHaveBeenCalled();
    expect(component.form.get('label')?.touched).toBeTrue();
  });

  it('should create a preset with the section-shaped payload', () => {
    configure('investigation', null);
    fixture.detectChanges();
    quickAddServiceSpy.add.and.returnValue(of({ hasError: false, decentMessage: 'ok', content: {} } as any));
    component.form.patchValue({ label: 'CBC', text: 'CBC' });

    component.onSubmit();

    expect(quickAddServiceSpy.add).toHaveBeenCalledWith({ sectionType: 'Investigation', label: 'CBC', payloadJson: JSON.stringify({ text: 'CBC' }) });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/quick-add', 'investigation']);
  });

  it('should load and patch an existing preset in edit mode', () => {
    quickAddServiceSpy = jasmine.createSpyObj('QuickAddService', ['getList', 'add', 'update', 'getAdvicePhraseDictionary']);
    quickAddServiceSpy.getList.and.returnValue(
      of({ hasError: false, decentMessage: 'ok', content: [{ quickAddPresetId: 5, sectionType: 'Investigation', label: 'CBC', payloadJson: JSON.stringify({ text: 'CBC' }) }] } as any),
    );
    TestBed.configureTestingModule({
      declarations: [ManageQuickAddPresetComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: QuickAddService, useValue: quickAddServiceSpy },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: ConfirmationService, useValue: jasmine.createSpyObj('ConfirmationService', ['confirm']) },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: BreadcrumbService, useValue: jasmine.createSpyObj('BreadcrumbService', ['setBreadcrumbs']) },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ section: 'investigation', id: '5' })) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ManageQuickAddPresetComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.isEditMode).toBeTrue();
    expect(component.form.get('label')?.value).toBe('CBC');
    expect(component.form.get('text')?.value).toBe('CBC');
  });

  it('should auto-fill Bangla from the phrase dictionary when the field is untouched', () => {
    configure('advice', null);
    fixture.detectChanges();

    component.form.get('en')?.setValue('Drink water.');
    component.onEnglishInput();

    expect(component.form.get('bn')?.value).toBe('পানি পান করুন।');
  });

  it('should confirm before overwriting a manually-edited Bangla translation', () => {
    configure('advice', null);
    fixture.detectChanges();
    component.form.get('bn')?.setValue('my own translation');
    component.onBanglaInput();
    confirmationServiceSpy.confirm.and.callFake((options: any) => options.accept());

    component.form.get('en')?.setValue('Drink water.');
    component.onEnglishInput();

    expect(confirmationServiceSpy.confirm).toHaveBeenCalled();
    expect(component.form.get('bn')?.value).toBe('পানি পান করুন।');
  });

  it('should not touch Bangla when the English text has no known translation', () => {
    configure('advice', null);
    fixture.detectChanges();

    component.form.get('en')?.setValue('Some unrecognized phrase.');
    component.onEnglishInput();

    expect(component.form.get('bn')?.value).toBeNull();
    expect(confirmationServiceSpy.confirm).not.toHaveBeenCalled();
  });
});
