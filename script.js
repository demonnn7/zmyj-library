// ============================================================
// 配置 - 请替换为您的 Supabase 项目信息
// ============================================================
const SUPABASE_URL = 'https://snjalmxaenojztluwsyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TSmweACGarca3JO7R1pVTQ_LI9Nw0kg';

// ============================================================
// 初始化 Supabase 客户端
// ============================================================
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// 默认数据（用于首次初始化）
// ============================================================
const DEFAULT_BOOKS = [
    { id: 1, title: '破镜重圆', author: '林听', platform: 'lofter', tags: ['现背', '破镜重圆/火葬场'], status: '已完结', ending: 'he', attributes: '龙弛', car: '√', chapters: '多篇章', link: '#' },
    { id: 2, title: '盛夏光年', author: '沈南乔', platform: 'ao3', tags: ['纯爱', '校园'], status: '未完结', ending: 'oe', attributes: '弛龙', car: '×', chapters: '一发完', link: '#' },
    { id: 3, title: '时光代理人', author: '陈一', platform: 'web', tags: ['破镜重圆/火葬场'], status: '', ending: 'be', attributes: '互攻', car: '', chapters: '', link: '#' },
    { id: 4, title: '春日迟', author: '温酒', platform: '小红书', tags: ['末世'], status: '自选结局', ending: '', attributes: '无差', car: '', chapters: '', link: '#' },
    { id: 5, title: '落雪满山', author: '江月', platform: '私站', tags: ['刑侦'], status: '', ending: '', attributes: '', car: '', chapters: '', link: '#' }
];

const DEFAULT_OPTIONS = {
    platform: ['lofter', 'ao3', 'web', '小红书', '私站'],
    status: ['已完结', '未完结', '自选结局'],
    ending: ['he', 'be', 'oe', '自选结局'],
    attributes: ['弛龙', '龙弛', '互攻', '无差'],
    car: ['√', '×'],
    chapters: ['一发完', '多篇章'],
    tags: ['现背', '纯爱', '破镜重圆/火葬场', '末世', '刑侦', '娱乐圈', '校园', '师生', '群像', '包养', '论坛体', '古风', '捡手机', '哨向', '背德', '双性', '网黄', 'fork/cake', 'ABO', '职场', '先婚后爱', '伯牙子期', '赵章', '林章', '性转', 'ntr', '9号房', '穿越']
};

// ============================================================
// 全局状态
// ============================================================
let BOOKS = [];
let OPTIONS = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
let currentFilter = {};
let isAdmin = false;
let editingBookId = null;
let addRowVisible = false;
let isDataLoaded = false;

// 筛选字段
const FILTER_FIELDS = ['platform', 'tags', 'status', 'ending', 'attributes', 'car', 'chapters'];
const COLUMNS = [
    { key: 'title', label: '文名' },
    { key: 'author', label: '作者' },
    { key: 'platform', label: '平台' },
    { key: 'tags', label: 'tag' },
    { key: 'status', label: '更新状态' },
    { key: 'ending', label: '结局' },
    { key: 'attributes', label: '属性' },
    { key: 'car', label: '🚗' },
    { key: 'chapters', label: '章节' },
    { key: 'link', label: '链接' }
];

// ============================================================
// DOM 引用
// ============================================================
const $ = id => document.getElementById(id);
const tableHead = $('tableHead');
const tableBody = $('tableBody');
const filterPanel = $('filterPanel');
const filterToggleBtn = $('filterToggleBtn');
const filterGrid = $('filterGrid');
const applyBtn = $('applyFilterBtn');
const resetBtn = $('resetFilterBtn');
const filterIndicator = $('filterIndicator');
const loginBtn = $('loginBtn');
const logoutBtn = $('logoutBtn');
const userBadge = $('userBadge');
const adminTools = $('adminTools');
const addRowArea = $('addRowArea');
const toggleAddRowBtn = $('toggleAddRowBtn');
const addBookBtn = $('addBookBtn');
const descriptionText = $('descriptionText');
const editHint = $('editHint');
const editModal = $('editModal');
const editFormContainer = $('editFormContainer');
const modalCancelBtn = $('modalCancelBtn');
const modalSaveBtn = $('modalSaveBtn');
const optionsModal = $('optionsModal');
const optionsContainer = $('optionsContainer');
const optionsCancelBtn = $('optionsCancelBtn');
const optionsSaveBtn = $('optionsSaveBtn');
const manageOptionsBtn = $('manageOptionsBtn');
const syncBtn = $('syncBtn');
const loadingOverlay = $('loadingOverlay');

// ============================================================
// Toast 提示
// ============================================================
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================================
// 数据库操作
// ============================================================
async function loadBooksFromDB() {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            BOOKS = data;
        } else {
            // 首次使用，插入默认数据
            BOOKS = DEFAULT_BOOKS;
            await saveBooksToDB();
        }
        return true;
    } catch (error) {
        console.error('加载图书失败:', error);
        // 使用本地缓存
        const cached = localStorage.getItem('books_cache');
        if (cached) {
            BOOKS = JSON.parse(cached);
            return true;
        }
        BOOKS = DEFAULT_BOOKS;
        return false;
    }
}

async function saveBooksToDB() {
    try {
        // 批量 upsert
        for (const book of BOOKS) {
            const { error } = await supabase
                .from('books')
                .upsert(book, { onConflict: 'id' });
            if (error) throw error;
        }
        // 更新本地缓存
        localStorage.setItem('books_cache', JSON.stringify(BOOKS));
        showToast('✅ 数据已保存到云端', 'success');
        return true;
    } catch (error) {
        console.error('保存失败:', error);
        showToast('❌ 保存失败: ' + error.message, 'error');
        return false;
    }
}

async function loadOptionsFromDB() {
    try {
        const { data, error } = await supabase
            .from('site_config')
            .select('*');
        
        if (error) throw error;
        
        const config = {};
        data.forEach(item => {
            if (item.key.startsWith('opt_')) {
                const key = item.key.replace('opt_', '');
                config[key] = JSON.parse(item.value);
            }
            if (item.key === 'description') {
                descriptionText.innerText = item.value || '图书馆使用说明：';
            }
        });
        
        if (Object.keys(config).length > 0) {
            OPTIONS = { ...OPTIONS, ...config };
        }
        return true;
    } catch (error) {
        console.error('加载选项失败:', error);
        return false;
    }
}

async function saveOptionsToDB() {
    try {
        for (const [key, value] of Object.entries(OPTIONS)) {
            const { error } = await supabase
                .from('site_config')
                .upsert({
                    key: `opt_${key}`,
                    value: JSON.stringify(value)
                }, { onConflict: 'key' });
            if (error) throw error;
        }
        showToast('✅ 选项已保存到云端', 'success');
        return true;
    } catch (error) {
        console.error('保存选项失败:', error);
        showToast('❌ 保存选项失败: ' + error.message, 'error');
        return false;
    }
}

async function saveDescriptionToDB(text) {
    try {
        const { error } = await supabase
            .from('site_config')
            .upsert({
                key: 'description',
                value: text
            }, { onConflict: 'key' });
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('保存说明失败:', error);
        return false;
    }
}

// ============================================================
// 登录管理
// ============================================================
async function login() {
    const username = prompt('请输入管理员账号:');
    if (!username) return;
    const password = prompt('请输入管理员密码:');
    if (!password) return;
    
    try {
        // 查询管理员（实际应用应使用 bcrypt 比较）
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error || !data) {
            showToast('❌ 用户不存在', 'error');
            return;
        }
        
        // 简化验证：生产环境应使用 bcrypt
        // 这里使用固定密码演示
        if (password === 'zmyj210602') {
            setAdminMode(true);
            localStorage.setItem('admin_session', 'true');
            localStorage.setItem('admin_session_time', Date.now().toString());
            showToast('✅ 登录成功', 'success');
        } else {
            showToast('❌ 密码错误', 'error');
        }
    } catch (error) {
        console.error('登录失败:', error);
        showToast('❌ 登录失败: ' + error.message, 'error');
    }
}

function logout() {
    setAdminMode(false);
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_session_time');
    showToast('已退出', 'info');
}

function checkAdminSession() {
    const session = localStorage.getItem('admin_session');
    const sessionTime = localStorage.getItem('admin_session_time');
    
    if (session === 'true' && sessionTime) {
        const elapsed = Date.now() - parseInt(sessionTime);
        // 会话有效期 30 天
        if (elapsed < 30 * 24 * 60 * 60 * 1000) {
            setAdminMode(true);
            return true;
        } else {
            localStorage.removeItem('admin_session');
            localStorage.removeItem('admin_session_time');
        }
    }
    return false;
}

function setAdminMode(admin) {
    isAdmin = admin;
    if (isAdmin) {
        userBadge.textContent = '👑 管理员';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        adminTools.style.display = 'flex';
        descriptionText.contentEditable = 'true';
        editHint.textContent = '✏️ 点击文字编辑 (管理员)';
        toggleAddRowBtn.style.display = 'inline-block';
        syncBtn.style.display = 'inline-block';
    } else {
        userBadge.textContent = '👤 游客';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        adminTools.style.display = 'none';
        descriptionText.contentEditable = 'false';
        editHint.textContent = '🔒 普通浏览';
        addRowArea.style.display = 'none';
        toggleAddRowBtn.style.display = 'none';
        syncBtn.style.display = 'none';
        closeEditModal();
        closeOptionsModal();
    }
    renderTableHeader();
    renderBooks(currentFilter);
}

// ============================================================
// 渲染函数
// ============================================================
function renderTableHeader() {
    let html = '<tr>';
    COLUMNS.forEach(col => { html += `<th>${col.label}</th>`; });
    if (isAdmin) html += `<th>操作</th>`;
    html += '</tr>';
    tableHead.innerHTML = html;
}

function renderBooks(filter = currentFilter) {
    const filtered = BOOKS.filter(book => {
        for (const field of FILTER_FIELDS) {
            if (filter[field] && filter[field].size > 0) {
                if (field === 'tags') {
                    const bookTags = book.tags || [];
                    if (!bookTags.some(t => filter[field].has(t))) return false;
                } else {
                    if (!filter[field].has(book[field] || '')) return false;
                }
            }
        }
        return true;
    });

    filterIndicator.textContent = `(${filtered.length})`;

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${COLUMNS.length + (isAdmin ? 1 : 0)}" class="empty-message">📭 没有找到符合条件的书籍</td></tr>`;
        return;
    }

    let bodyHtml = '';
    filtered.forEach(book => {
        bodyHtml += '<tr>';
        COLUMNS.forEach(col => {
            let value = book[col.key];
            if (col.key === 'tags') {
                const tags = Array.isArray(value) ? value : [value];
                value = tags.filter(t => t).map(t => `<span class="tag-badge">${t}</span>`).join(' ');
            } else if (col.key === 'status') {
                let cls = 'status-completed';
                if (value === '连载中' || value === '未完结') cls = 'status-serializing';
                else if (value === '断更') cls = 'status-hiatus';
                value = `<span class="status-badge ${cls}">${value || '-'}</span>`;
            } else if (col.key === 'link') {
                value = `<a href="${value}" class="link-icon" target="_blank">🔗 链接</a>`;
            } else if (col.key === 'chapters') {
                value = `<span style="font-weight:500;">${value || '-'}</span>`;
            } else if (col.key === 'car') {
                value = `<span style="font-size:1.2rem;">${value || '-'}</span>`;
            } else {
                value = value ?? '-';
            }
            bodyHtml += `<td>${value}</td>`;
        });
        if (isAdmin) {
            bodyHtml += `<td><div class="admin-actions-cell">
                <button class="btn-sm edit" data-id="${book.id}">✎</button>
                <button class="btn-sm danger" data-id="${book.id}">✕</button>
            </div></td>`;
        }
        bodyHtml += '</tr>';
    });
    tableBody.innerHTML = bodyHtml;
    
    if (isAdmin) {
        document.querySelectorAll('#tableBody .btn-sm.edit').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
        });
        document.querySelectorAll('#tableBody .btn-sm.danger').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('确定删除这本书吗？')) {
                    deleteBook(parseInt(btn.dataset.id));
                }
            });
        });
    }
}

function renderFilterPanel() {
    let html = '';
    FILTER_FIELDS.forEach(fieldKey => {
        const options = getFilterOptions(fieldKey);
        const labelMap = { 
            'platform': '📱 平台', 
            'tags': '🏷️ tag', 
            'status': '📌 更新状态', 
            'ending': '🎯 结局', 
            'attributes': '✨ 属性', 
            'car': '🚗', 
            'chapters': '📖 章节' 
        };
        html += `<div class="filter-group"><label>${labelMap[fieldKey] || fieldKey}</label><div class="filter-options" data-field="${fieldKey}">`;
        options.forEach(opt => {
            const checked = currentFilter[fieldKey]?.has(opt) || false;
            html += `<label><input type="checkbox" value="${opt}" data-field="${fieldKey}" ${checked ? 'checked' : ''}> ${opt}</label>`;
        });
        html += `</div></div>`;
    });
    filterGrid.innerHTML = html;
}

function getFilterOptions(fieldKey) {
    const allValues = BOOKS.flatMap(book => {
        if (fieldKey === 'tags') return book.tags || [];
        return [book[fieldKey] || ''];
    });
    const preset = OPTIONS[fieldKey] || [];
    const combined = [...new Set([...allValues, ...preset])];
    return combined.filter(v => v && v !== '').sort();
}

function collectFilterFromPanel() {
    FILTER_FIELDS.forEach(field => { currentFilter[field] = new Set(); });
    document.querySelectorAll('#filterGrid input[type="checkbox"]:checked').forEach(cb => {
        const field = cb.dataset.field;
        if (currentFilter[field]) currentFilter[field].add(cb.value);
    });
}

function applyFilterAndRender() {
    collectFilterFromPanel();
    renderBooks(currentFilter);
}

function resetFilter() {
    document.querySelectorAll('#filterGrid input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    FILTER_FIELDS.forEach(field => { currentFilter[field] = new Set(); });
    renderBooks(currentFilter);
    filterIndicator.textContent = `(${BOOKS.length})`;
}

// ============================================================
// 添加行渲染
// ============================================================
function renderAddRowSelectors() {
    const fields = ['platform', 'status', 'ending', 'attributes', 'car', 'chapters'];
    fields.forEach(field => {
        const sel = $(`new${field.charAt(0).toUpperCase() + field.slice(1)}`);
        if (!sel) return;
        sel.innerHTML = `<option value="">${field === 'car' ? '🚗' : field}*</option>`;
        (OPTIONS[field] || []).forEach(opt => {
            sel.innerHTML += `<option value="${opt}">${opt}</option>`;
        });
    });
    
    const container = $('newTagsContainer');
    container.innerHTML = '';
    (OPTIONS.tags || []).forEach(tag => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${tag}"> ${tag}`;
        container.appendChild(label);
    });
}

// ============================================================
// 管理员操作
// ============================================================
function deleteBook(id) {
    BOOKS = BOOKS.filter(b => b.id !== id);
    renderFilterPanel();
    renderBooks(currentFilter);
    // 自动保存
    saveBooksToDB();
}

function openEditModal(id) {
    const book = BOOKS.find(b => b.id === id);
    if (!book) return;
    editingBookId = id;
    
    let html = `
        <div class="modal-field"><label>文名</label><input type="text" id="editTitle" value="${book.title}"></div>
        <div class="modal-field"><label>作者</label><input type="text" id="editAuthor" value="${book.author}"></div>
        <div class="modal-field"><label>平台</label><select id="editPlatform">`;
    (OPTIONS.platform || []).forEach(p => {
        html += `<option value="${p}" ${p === book.platform ? 'selected' : ''}>${p}</option>`;
    });
    html += `</select></div>
        <div class="modal-field"><label>Tag (多选)</label><div class="tag-select-container" id="editTagsContainer">`;
    (OPTIONS.tags || []).forEach(tag => {
        const checked = (book.tags || []).includes(tag) ? 'checked' : '';
        html += `<label><input type="checkbox" value="${tag}" ${checked}> ${tag}</label>`;
    });
    html += `</div></div>
        <div class="modal-field"><label>更新状态</label><select id="editStatus">`;
    (OPTIONS.status || []).forEach(s => {
        html += `<option value="${s}" ${s === book.status ? 'selected' : ''}>${s}</option>`;
    });
    html += `</select></div>
        <div class="modal-field"><label>结局</label><select id="editEnding">`;
    (OPTIONS.ending || []).forEach(e => {
        html += `<option value="${e}" ${e === book.ending ? 'selected' : ''}>${e}</option>`;
    });
    html += `</select></div>
        <div class="modal-field"><label>属性</label><select id="editAttributes">`;
    (OPTIONS.attributes || []).forEach(a => {
        html += `<option value="${a}" ${a === book.attributes ? 'selected' : ''}>${a}</option>`;
    });
    html += `</select></div>
        <div class="modal-field"><label>🚗</label><select id="editCar">`;
    (OPTIONS.car || []).forEach(c => {
        html += `<option value="${c}" ${c === book.car ? 'selected' : ''}>${c}</option>`;
    });
    html += `</select></div>
        <div class="modal-field"><label>章节</label><select id="editChapters">`;
    (OPTIONS.chapters || []).forEach(c => {
        html += `<option value="${c}" ${c === book.chapters ? 'selected' : ''}>${c}</option>`;
    });
    html += `</select></div>
        <div class="modal-field"><label>链接</label><input type="text" id="editLink" value="${book.link}"></div>
    `;
    editFormContainer.innerHTML = html;
    editModal.classList.add('active');
}

function saveEditModal() {
    const id = editingBookId;
    if (!id) return;
    const book = BOOKS.find(b => b.id === id);
    if (!book) return;
    
    book.title = $('editTitle').value.trim() || book.title;
    book.author = $('editAuthor').value.trim() || book.author;
    book.platform = $('editPlatform').value;
    const tagChecks = document.querySelectorAll('#editTagsContainer input[type="checkbox"]:checked');
    book.tags = Array.from(tagChecks).map(cb => cb.value);
    book.status = $('editStatus').value;
    book.ending = $('editEnding').value;
    book.attributes = $('editAttributes').value;
    book.car = $('editCar').value;
    book.chapters = $('editChapters').value;
    book.link = $('editLink').value.trim() || '#';
    
    closeEditModal();
    renderFilterPanel();
    renderBooks(currentFilter);
    saveBooksToDB();
}

function closeEditModal() {
    editModal.classList.remove('active');
    editingBookId = null;
}

function addBookFromForm() {
    const title = $('newTitle').value.trim();
    const author = $('newAuthor').value.trim();
    const platform = $('newPlatform').value;
    const status = $('newStatus').value;
    const ending = $('newEnding').value;
    const attributes = $('newAttributes').value;
    const car = $('newCar').value;
    const chapters = $('newChapters').value;
    const link = $('newLink').value.trim() || '#';
    const tagChecks = document.querySelectorAll('#newTagsContainer input[type="checkbox"]:checked');
    const tags = Array.from(tagChecks).map(cb => cb.value);

    if (!title || !author || !platform || !status || !ending || !attributes || !car || !chapters) {
        showToast('❌ 请完整填写所有必填项', 'error');
        return;
    }
    
    const maxId = BOOKS.reduce((max, b) => Math.max(max, b.id || 0), 0);
    const newBook = {
        id: maxId + 1,
        title, author, platform,
        tags, status, ending, attributes, car, chapters, link
    };
    BOOKS.push(newBook);
    
    // 清空表单
    ['newTitle','newAuthor','newPlatform','newStatus','newEnding','newAttributes','newCar','newChapters','newLink'].forEach(id => $(id).value = '');
    document.querySelectorAll('#newTagsContainer input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    renderFilterPanel();
    renderBooks(currentFilter);
    saveBooksToDB();
    showToast('✅ 已添加: ' + title, 'success');
}

// ============================================================
// 管理选项
// ============================================================
function renderOptionsManager() {
    let html = '';
    const groups = ['platform', 'status', 'ending', 'attributes', 'car', 'chapters', 'tags'];
    const labels = {
        'platform': '平台', 'status': '更新状态', 'ending': '结局',
        'attributes': '属性', 'car': '🚗', 'chapters': '章节', 'tags': 'Tag'
    };
    
    groups.forEach(g => {
        const items = OPTIONS[g] || [];
        html += `<div class="option-group" data-group="${g}">
            <div class="group-title">${labels[g] || g}</div>
            <div class="option-tag-list">`;
        items.forEach(item => {
            html += `<span class="option-tag-item">${item} <button class="del-opt" data-group="${g}" data-value="${item}">×</button></span>`;
        });
        html += `</div>
            <div class="option-add-row">
                <input type="text" placeholder="添加新选项" class="opt-add-input" data-group="${g}">
                <button class="btn-sm opt-add-btn" data-group="${g}">添加</button>
            </div>
        </div>`;
    });
    optionsContainer.innerHTML = html;

    // 删除事件
    optionsContainer.querySelectorAll('.del-opt').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.dataset.group;
            const value = this.dataset.value;
            if (OPTIONS[group]) {
                OPTIONS[group] = OPTIONS[group].filter(v => v !== value);
                renderOptionsManager();
                renderAddRowSelectors();
                renderFilterPanel();
                renderBooks(currentFilter);
            }
        });
    });

    // 添加事件
    optionsContainer.querySelectorAll('.opt-add-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.dataset.group;
            const input = this.parentElement.querySelector('.opt-add-input');
            const val = input.value.trim();
            if (val && OPTIONS[group] && !OPTIONS[group].includes(val)) {
                OPTIONS[group].push(val);
                renderOptionsManager();
                renderAddRowSelectors();
                renderFilterPanel();
                renderBooks(currentFilter);
                input.value = '';
            } else if (!val) {
                showToast('请输入内容', 'error');
            } else {
                showToast('选项已存在', 'error');
            }
        });
    });
}

function openOptionsModal() {
    renderOptionsManager();
    optionsModal.classList.add('active');
}

function closeOptionsModal() {
    optionsModal.classList.remove('active');
}

// ============================================================
// UI 切换
// ============================================================
function toggleAddRow() {
    addRowVisible = !addRowVisible;
    addRowArea.style.display = addRowVisible ? 'block' : 'none';
    if (addRowVisible) renderAddRowSelectors();
}

function toggleFilterPanel() {
    filterPanel.classList.toggle('open');
}

// ============================================================
// 保存所有数据
// ============================================================
async function saveAllData() {
    if (!isAdmin) {
        showToast('请先登录管理员账号', 'error');
        return;
    }
    await saveBooksToDB();
    await saveOptionsToDB();
    const descText = descriptionText.innerText.trim();
    await saveDescriptionToDB(descText);
}

// ============================================================
// 初始化
// ============================================================
async function init() {
    // 加载数据
    await loadBooksFromDB();
    await loadOptionsFromDB();
    
    // 检查登录状态
    checkAdminSession();
    
    // 渲染
    renderTableHeader();
    renderFilterPanel();
    renderBooks(currentFilter);
    renderAddRowSelectors();
    
    // 隐藏加载提示
    loadingOverlay.style.display = 'none';
    isDataLoaded = true;
    
    // 事件绑定
    loginBtn.addEventListener('click', login);
    logoutBtn.addEventListener('click', logout);
    applyBtn.addEventListener('click', applyFilterAndRender);
    resetBtn.addEventListener('click', resetFilter);
    filterToggleBtn.addEventListener('click', toggleFilterPanel);
    toggleAddRowBtn.addEventListener('click', toggleAddRow);
    addBookBtn.addEventListener('click', addBookFromForm);
    syncBtn.addEventListener('click', saveAllData);
    
    modalCancelBtn.addEventListener('click', closeEditModal);
    modalSaveBtn.addEventListener('click', saveEditModal);
    editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });
    
    manageOptionsBtn.addEventListener('click', openOptionsModal);
    optionsCancelBtn.addEventListener('click', closeOptionsModal);
    optionsSaveBtn.addEventListener('click', async () => {
        closeOptionsModal();
        await saveOptionsToDB();
        showToast('✅ 选项已保存', 'success');
    });
    optionsModal.addEventListener('click', e => { if (e.target === optionsModal) closeOptionsModal(); });
    
    // 描述编辑保存
    descriptionText.addEventListener('blur', async () => {
        if (isAdmin) {
            const text = descriptionText.innerText.trim();
            await saveDescriptionToDB(text);
        }
    });
    
    filterPanel.classList.remove('open');
    filterToggleBtn.innerHTML = '<span>⚙️</span> 筛选 <span id="filterIndicator">(' + BOOKS.length + ')</span>';
}

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', init);