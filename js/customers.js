// تهيئة المتغيرات الأساسية
// استرجاع بيانات العملاء من التخزين المحلي، إذا لم تكن موجودة نستخدم مصفوفة فارغة
let customers = JSON.parse(localStorage.getItem('customers')) || [];

// حساب الرقم التسلسلي التالي للعميل الجديد
let nextCustomerId = Math.max(0, ...customers.map(c => c.id)) + 1;

// متغير لتخزين العميل المراد حذفه مؤقتاً
let customerToDelete = null;

// دالة لتحسين أداء البحث باستخدام debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// إضافة مستمع لحدث البحث في الجدول
document.getElementById('searchInput').addEventListener('input', debounce(function(e) {
    const searchText = e.target.value.toLowerCase();
    const tbody = document.getElementById('customersTableBody');
    const rows = tbody.getElementsByTagName('tr');
    
    // استخدام Fragment لتحسين الأداء
    const fragment = document.createDocumentFragment();
    const visibleRows = [];
    const hiddenRows = [];
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchText)) {
            row.style.display = '';
            visibleRows.push(row);
        } else {
            row.style.display = 'none';
            hiddenRows.push(row);
        }
    }
    
    // إعادة ترتيب الصفوف المرئية في المقدمة
    visibleRows.forEach(row => fragment.appendChild(row));
    hiddenRows.forEach(row => fragment.appendChild(row));
    
    tbody.appendChild(fragment);
}, 300));

// دالة لعرض نموذج إضافة عميل جديد
function showAddCustomerForm() {
    const form = document.getElementById('addCustomerForm');
    form.style.display = 'block';
    setTimeout(() => {
        form.classList.add('show');
    }, 10);
    document.getElementById('customerForm').reset();
}

// دالة لإخفاء نموذج إضافة عميل جديد
function hideAddCustomerForm() {
    const form = document.getElementById('addCustomerForm');
    form.classList.remove('show');
    setTimeout(() => {
        form.style.display = 'none';
    }, 300);
}

// دالة للتحقق من صحة رقم الهاتف
function validatePhone(phone) {
    // التحقق من أن رقم الهاتف يتكون من 11 رقم ويبدأ بـ 01
    const phoneRegex = /^01[0125][0-9]{8}$/;
    return phoneRegex.test(phone);
}

// دالة للتحقق من صحة اسم العميل
function validateName(name) {
    // التحقق من أن الاسم يحتوي على حرفين على الأقل
    return name.trim().length >= 2;
}

// دالة لإضافة عميل جديد
function addNewCustomer(event) {
    event.preventDefault();
    
    try {
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const balance = parseFloat(document.getElementById('initialBalance').value) || 0;
        const accountType = document.getElementById('accountType').value;
        const address = document.getElementById('customerAddress').value.trim();
        
        // التحقق من صحة البيانات
        if (!validateName(name)) {
            throw new Error('يجب أن يكون اسم العميل حرفين على الأقل');
        }
        
        if (!validatePhone(phone)) {
            throw new Error('رقم الهاتف غير صحيح. يجب أن يكون 11 رقم ويبدأ بـ 01');
        }
        
        // التحقق من وجود العميل
        const existingCustomerByName = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (existingCustomerByName) {
            throw new Error(`يوجد عميل بنفس الاسم "${name}"`);
        }

        // التحقق من عدم تكرار رقم الهاتف
        const existingCustomerByPhone = customers.find(c => c.phone === phone);
        if (existingCustomerByPhone) {
            throw new Error(`رقم الهاتف ${phone} مستخدم بالفعل للعميل "${existingCustomerByPhone.name}"`);
        }

        // إنشاء كائن العميل الجديد
        const newCustomer = {
            id: nextCustomerId++,
            name,
            phone,
            balance,
            accountType,
            address
        };

        // إضافة العميل للمصفوفة وحفظها في التخزين المحلي
        customers.push(newCustomer);
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // إضافة العميل للجدول وإخفاء النموذج
        addCustomerToTable(newCustomer);
        hideAddCustomerForm();
        
        // عرض رسالة نجاح
        showNotification('تم إضافة العميل بنجاح');
    } catch (error) {
        console.error('خطأ في إضافة العميل:', error);
        showNotification(error.message, true);
    }
}

// دالة لإضافة عميل للجدول
function addCustomerToTable(customer) {
    const tbody = document.getElementById('customersTableBody');
    const row = document.createElement('tr');
    row.setAttribute('data-customer-id', customer.id);
    
    // إنشاء محتوى الصف
    row.innerHTML = `
        <td>${customer.id}</td>
        <td>${customer.name}</td>
        <td>${customer.phone}</td>
        <td>${customer.balance.toFixed(2)} جنيه</td>
        <td>${customer.address}</td>
        <td>
            <div class="actions">
                <button class="send-btn" onclick="sendToCustomer(${customer.id})">إرسال</button>
                <button class="receive-btn" onclick="receiveFromCustomer(${customer.id})">استلام</button>
                <button class="edit-btn" onclick="editCustomer(${customer.id})">تعديل</button>
                <button class="delete-btn" onclick="showConfirmationModal(${customer.id})">حذف</button>
            </div>
        </td>
    `;
    
    // إضافة الصف في بداية الجدول
    tbody.insertBefore(row, tbody.firstChild);
}

// دالة لعرض رسائل التنبيه
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'notification' + (isError ? ' error' : '');
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // إزالة التنبيه بعد 3 ثواني
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// دالة لعرض نافذة تأكيد الحذف
function showConfirmationModal(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showNotification('خطأ: لم يتم العثور على العميل', true);
        return;
    }

    customerToDelete = customer;
    document.getElementById('confirmationMessage').textContent = `هل أنت متأكد من حذف العميل "${customer.name}"؟`;
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'block';
    // إضافة تأخير صغير لضمان ظهور الحركة
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// دالة لإخفاء نافذة تأكيد الحذف
function hideConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.classList.remove('show');
    // انتظار انتهاء حركة الإغلاق قبل إخفاء العنصر
    setTimeout(() => {
        modal.style.display = 'none';
        customerToDelete = null;
    }, 500);
}

// دالة لتأكيد حذف العميل
function confirmDelete() {
    if (!customerToDelete) return;

    const id = customerToDelete.id;
    // حذف العميل من المصفوفة
    customers = customers.filter(c => c.id !== id);
    // تحديث التخزين المحلي
    localStorage.setItem('customers', JSON.stringify(customers));
    
    // حذف الصف من الجدول
    const row = document.querySelector(`#customersTableBody tr[data-customer-id="${id}"]`);
    if (row) {
        row.remove();
    }
    
    // إخفاء النافذة وعرض رسالة نجاح
    hideConfirmationModal();
    showNotification('تم حذف العميل بنجاح');
}

// دالة لإرسال الأموال للعميل
function sendToCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showNotification('خطأ: لم يتم العثور على العميل', true);
        return;
    }

    const amount = parseFloat(prompt('أدخل المبلغ المراد إرساله:'));
    if (isNaN(amount) || amount <= 0) {
        showNotification('خطأ: يرجى إدخال مبلغ صحيح', true);
        return;
    }

    try {
        customer.balance += amount;
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // تحديث عرض الرصيد في الجدول
        const row = document.querySelector(`#customersTableBody tr[data-customer-id="${id}"]`);
        if (row) {
            row.querySelector('td:nth-child(4)').textContent = `${customer.balance.toFixed(2)} جنيه`;
        }
        
        showNotification(`تم إرسال ${amount.toFixed(2)} جنيه بنجاح إلى ${customer.name}`);
    } catch (error) {
        console.error('خطأ في عملية الإرسال:', error);
        showNotification('حدث خطأ أثناء عملية الإرسال', true);
    }
}

// دالة لاستلام الأموال من العميل
function receiveFromCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showNotification('خطأ: لم يتم العثور على العميل', true);
        return;
    }

    const amount = parseFloat(prompt('أدخل المبلغ المراد استلامه:'));
    if (isNaN(amount) || amount <= 0) {
        showNotification('خطأ: يرجى إدخال مبلغ صحيح', true);
        return;
    }

    if (amount > customer.balance) {
        showNotification('خطأ: الرصيد غير كافي', true);
        return;
    }

    try {
        customer.balance -= amount;
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // تحديث عرض الرصيد في الجدول
        const row = document.querySelector(`#customersTableBody tr[data-customer-id="${id}"]`);
        if (row) {
            row.querySelector('td:nth-child(4)').textContent = `${customer.balance.toFixed(2)} جنيه`;
        }
        
        showNotification(`تم استلام ${amount.toFixed(2)} جنيه بنجاح من ${customer.name}`);
    } catch (error) {
        console.error('خطأ في عملية الاستلام:', error);
        showNotification('حدث خطأ أثناء عملية الاستلام', true);
    }
}

// دالة لعرض نموذج تعديل العميل
function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showNotification('خطأ: لم يتم العثور على العميل', true);
        return;
    }

    const form = document.getElementById('addCustomerForm');
    form.style.display = 'block';
    setTimeout(() => {
        form.classList.add('show');
    }, 10);

    // تعبئة النموذج ببيانات العميل
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('initialBalance').value = customer.balance;
    document.getElementById('accountType').value = customer.accountType;
    document.getElementById('customerAddress').value = customer.address;

    // تغيير عنوان النموذج وزر الحفظ
    form.querySelector('h2').textContent = 'تعديل بيانات العميل';
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.textContent = 'حفظ التعديلات';

    // تعديل وظيفة الحفظ
    const customerForm = document.getElementById('customerForm');
    customerForm.onsubmit = function(event) {
        event.preventDefault();
        
        const name = document.getElementById('customerName').value;
        const phone = document.getElementById('customerPhone').value;
        
        // التحقق من صحة البيانات
        if (!validateName(name)) {
            showNotification('خطأ: يجب أن يكون اسم العميل حرفين على الأقل', true);
            return;
        }
        
        if (!validatePhone(phone)) {
            showNotification('خطأ: رقم الهاتف غير صحيح. يجب أن يكون 11 رقم ويبدأ بـ 01', true);
            return;
        }
        
        // التحقق من عدم تكرار الاسم ورقم الهاتف
        const existingCustomerByName = customers.find(c => c.id !== id && c.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (existingCustomerByName) {
            showNotification(`خطأ: يوجد عميل بنفس الاسم "${name}"`, true);
            return;
        }

        const existingCustomerByPhone = customers.find(c => c.id !== id && c.phone === phone);
        if (existingCustomerByPhone) {
            showNotification(`خطأ: رقم الهاتف ${phone} مستخدم بالفعل للعميل "${existingCustomerByPhone.name}"`, true);
            return;
        }

        // تحديث بيانات العميل
        customer.name = name;
        customer.phone = phone;
        customer.balance = parseFloat(document.getElementById('initialBalance').value) || 0;
        customer.accountType = document.getElementById('accountType').value;
        customer.address = document.getElementById('customerAddress').value;

        // تحديث التخزين المحلي
        localStorage.setItem('customers', JSON.stringify(customers));
        
        // تحديث صف العميل في الجدول
        const row = document.querySelector(`#customersTableBody tr[data-customer-id="${id}"]`);
        if (row) {
            row.innerHTML = `
                <td>${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.balance.toFixed(2)} جنيه</td>
                <td>${customer.address}</td>
                <td>
                    <div class="actions">
                        <button class="send-btn" onclick="sendToCustomer(${customer.id})">إرسال</button>
                        <button class="receive-btn" onclick="receiveFromCustomer(${customer.id})">استلام</button>
                        <button class="edit-btn" onclick="editCustomer(${customer.id})">تعديل</button>
                        <button class="delete-btn" onclick="showConfirmationModal(${customer.id})">حذف</button>
                    </div>
                </td>
            `;
        }
        
        // إخفاء النموذج وعرض رسالة نجاح
        hideAddCustomerForm();
        showNotification('تم تحديث بيانات العميل بنجاح');
        
        // إعادة تعيين النموذج لحالته الأصلية
        form.querySelector('h2').textContent = 'إضافة عميل جديد';
        submitBtn.textContent = 'إضافة العميل';
        customerForm.onsubmit = addNewCustomer;
    };
}

// تحميل العملاء عند تحميل الصفحة
window.addEventListener('load', function() {
    customers.forEach(customer => addCustomerToTable(customer));
    
    // التحقق من حالة القائمة الجانبية
    const iframe = document.querySelector('iframe');
    iframe.onload = function() {
        const sidebarState = iframe.contentWindow.document.querySelector('.sidebar').classList.contains('collapsed');
        document.body.classList.toggle('sidebar-collapsed', sidebarState);
    };
});

// الاستماع لرسائل من القائمة الجانبية
window.addEventListener('message', function(event) {
    if (event.data === 'toggleSidebar') {
        document.body.classList.toggle('sidebar-collapsed');
    }
});
