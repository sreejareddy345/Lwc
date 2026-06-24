import { LightningElement, track } from 'lwc';
import getFilterOptions from '@salesforce/apex/SSA_AnalyzerController.getFilterOptions';
import analyzeObjectPermissions from '@salesforce/apex/SSA_AnalyzerController.analyzeObjectPermissions';
import analyzeProfiles from '@salesforce/apex/SSA_AnalyzerController.analyzeProfiles';
import analyzePermSets from '@salesforce/apex/SSA_AnalyzerController.analyzePermSets';
import analyzePSGs from '@salesforce/apex/SSA_AnalyzerController.analyzePSGs';
import analyzeUsers from '@salesforce/apex/SSA_AnalyzerController.analyzeUsers';
import generateCSV from '@salesforce/apex/SSA_AnalyzerController.generateCSV';

export default class SsaOrgAnalyzer extends LightningElement {

    activeTab = 'objectPerms';

    // Filter options
    @track objectOptions = [{ label: 'All Objects', value: 'all' }];
    @track profileOptions = [{ label: 'All Profiles', value: 'all' }];
    @track permSetOptions = [{ label: 'All Permission Sets', value: 'all' }];
    @track psgOptions = [{ label: 'All PSGs', value: 'all' }];

    crudOptions = [
        { label: 'All', value: 'all' },
        { label: 'Full CRED', value: 'full_access' },
        { label: 'Modify All', value: 'modify_all' },
        { label: 'Delete Access', value: 'delete' }
    ];

    // Object Perm filters
    objFilter = 'all';
    objProfileFilter = 'all';
    objPermSetFilter = 'all';
    crudFilter = 'all';

    // Profile filter
    profileFilter = 'all';

    // PermSet filter
    psFilter = 'all';

    // PSG filter
    psgFilter = 'all';

    // User filters
    userProfileFilter = 'all';
    userNameFilter = '';

    // Data
    @track objectPermData = null;
    @track objectPermRows = [];
    @track profileData = null;
    @track profileRows = [];
    @track permSetData = null;
    @track permSetRows = [];
    @track psgData = null;
    @track psgRows = [];
    @track userData = null;
    @track userRows = [];

    // Loading
    isLoadingObj = false;
    isLoadingProfiles = false;
    isLoadingPS = false;
    isLoadingPSG = false;
    isLoadingUsers = false;

    // Sort
    objSortedBy; objSortedDirection = 'asc';
    profSortedBy; profSortedDirection = 'asc';
    psSortedBy; psSortedDirection = 'asc';
    psgSortedBy; psgSortedDirection = 'asc';
    userSortedBy; userSortedDirection = 'asc';

    statusMessage = '';

    // Column definitions
    objectPermColumns = [
        { label: 'Object', fieldName: 'objectName', sortable: true },
        { label: 'Profile/PermSet', fieldName: 'refName', sortable: true },
        { label: 'Type', fieldName: 'refType', sortable: true },
        { label: 'Create', fieldName: 'canCreateDisplay', sortable: true,
          cellAttributes: { class: { fieldName: 'createClass' } } },
        { label: 'Read', fieldName: 'canReadDisplay', sortable: true,
          cellAttributes: { class: { fieldName: 'readClass' } } },
        { label: 'Edit', fieldName: 'canEditDisplay', sortable: true,
          cellAttributes: { class: { fieldName: 'editClass' } } },
        { label: 'Delete', fieldName: 'canDeleteDisplay', sortable: true,
          cellAttributes: { class: { fieldName: 'deleteClass' } } },
        { label: 'View All', fieldName: 'viewAllDisplay', sortable: true },
        { label: 'Modify All', fieldName: 'modifyAllDisplay', sortable: true,
          cellAttributes: { class: { fieldName: 'modifyClass' } } }
    ];

    profileColumns = [
        { label: 'Profile Name', fieldName: 'profileName', sortable: true },
        { label: 'Active Users', fieldName: 'activeUsers', type: 'number', sortable: true },
        { label: 'Inactive Users', fieldName: 'inactiveUsers', type: 'number', sortable: true },
        { label: 'Total Users', fieldName: 'totalUsers', type: 'number', sortable: true },
        { label: 'Status', fieldName: 'status', sortable: true,
          cellAttributes: { class: { fieldName: 'statusClass' } } }
    ];

    permSetColumns = [
        { label: 'Permission Set', fieldName: 'psLabel', sortable: true },
        { label: 'API Name', fieldName: 'psName', sortable: true },
        { label: 'Active Users', fieldName: 'activeUsers', type: 'number', sortable: true },
        { label: 'Inactive Users', fieldName: 'inactiveUsers', type: 'number', sortable: true },
        { label: 'Total Users', fieldName: 'totalUsers', type: 'number', sortable: true },
        { label: 'Part of PSGs', fieldName: 'partOfPSGs', sortable: true },
        { label: 'Status', fieldName: 'status', sortable: true,
          cellAttributes: { class: { fieldName: 'statusClass' } } }
    ];

    psgColumns = [
        { label: 'PSG Name', fieldName: 'psgLabel', sortable: true },
        { label: 'API Name', fieldName: 'psgName', sortable: true },
        { label: 'Active Users', fieldName: 'activeUsers', type: 'number', sortable: true },
        { label: 'Inactive Users', fieldName: 'inactiveUsers', type: 'number', sortable: true },
        { label: 'Total Users', fieldName: 'totalUsers', type: 'number', sortable: true },
        { label: '# PS Inside', fieldName: 'numPS', type: 'number', sortable: true },
        { label: 'Contained PS', fieldName: 'containedPS', sortable: true },
        { label: 'Status', fieldName: 'usageStatus', sortable: true,
          cellAttributes: { class: { fieldName: 'statusClass' } } }
    ];

    userColumns = [
        { label: 'Username', fieldName: 'username', sortable: true },
        { label: 'Full Name', fieldName: 'fullName', sortable: true },
        { label: 'Email', fieldName: 'email', sortable: true },
        { label: 'Profile', fieldName: 'profileName', sortable: true },
        { label: 'Active', fieldName: 'isActiveDisplay', sortable: true,
          cellAttributes: { class: { fieldName: 'activeClass' } } },
        { label: 'User Type', fieldName: 'userType', sortable: true },
        { label: 'Last Login', fieldName: 'lastLogin', sortable: true },
        { label: 'Created', fieldName: 'createdDate', sortable: true }
    ];

    // Computed
    get noObjectData() { return !this.objectPermRows || this.objectPermRows.length === 0; }
    get noProfileData() { return !this.profileRows || this.profileRows.length === 0; }
    get noPermSetData() { return !this.permSetRows || this.permSetRows.length === 0; }
    get noPSGData() { return !this.psgRows || this.psgRows.length === 0; }
    get noUserData() { return !this.userRows || this.userRows.length === 0; }
    get objRowCount() { return this.objectPermRows ? this.objectPermRows.length : 0; }
    get objObjectCount() {
        if (!this.objectPermRows) return 0;
        let objs = new Set();
        this.objectPermRows.forEach(r => objs.add(r.objectName));
        return objs.size;
    }
    get profileRowCount() { return this.profileRows ? this.profileRows.length : 0; }
    get psRowCount() { return this.permSetRows ? this.permSetRows.length : 0; }
    get psgRowCount() { return this.psgRows ? this.psgRows.length : 0; }

    connectedCallback() {
        this.loadFilterOptions();
    }

    loadFilterOptions() {
        getFilterOptions()
            .then(data => {
                if (data.objects) {
                    this.objectOptions = [{ label: 'All Objects', value: 'all' },
                        ...data.objects.map(o => ({ label: o.label, value: o.value }))];
                }
                if (data.profiles) {
                    this.profileOptions = [{ label: 'All Profiles', value: 'all' },
                        ...data.profiles.map(p => ({ label: p.label, value: p.value }))];
                }
                if (data.permissionSets) {
                    this.permSetOptions = [{ label: 'All Permission Sets', value: 'all' },
                        ...data.permissionSets.map(ps => ({ label: ps.label, value: ps.value }))];
                }
                if (data.psgs) {
                    this.psgOptions = [{ label: 'All PSGs', value: 'all' },
                        ...data.psgs.map(g => ({ label: g.label, value: g.value }))];
                }
            })
            .catch(error => {
                console.error('Error loading options:', error);
            });
    }

    handleTabChange(event) {
        this.activeTab = event.target.value;
    }

    // Filter handlers
    handleObjFilterChange(e) { this.objFilter = e.detail.value; }
    handleObjProfileChange(e) { this.objProfileFilter = e.detail.value; this.objPermSetFilter = 'all'; }
    handleObjPermSetChange(e) { this.objPermSetFilter = e.detail.value; this.objProfileFilter = 'all'; }
    handleCrudFilterChange(e) { this.crudFilter = e.detail.value; }
    handleProfileFilterChange(e) { this.profileFilter = e.detail.value; }
    handlePSFilterChange(e) { this.psFilter = e.detail.value; }
    handlePSGFilterChange(e) { this.psgFilter = e.detail.value; }
    handleUserProfileChange(e) { this.userProfileFilter = e.detail.value; }
    handleUserNameChange(e) { this.userNameFilter = e.detail.value; }

    // Object Permissions
    handleAnalyzeObjectPerms() {
        this.isLoadingObj = true;
        this.objectPermData = null;
        this.objectPermRows = [];

        let profName = this.objProfileFilter !== 'all' ? this.objProfileFilter : null;
        let psName = this.objPermSetFilter !== 'all' ? this.objPermSetFilter : null;

        analyzeObjectPermissions({
            objectName: this.objFilter,
            profileName: profName,
            permSetName: psName,
            crudFilter: this.crudFilter
        })
        .then(data => {
            this.objectPermData = data;
            let rows = data.rows || [];
            this.objectPermRows = rows.map((r, idx) => ({
                ...r,
                id: 'obj-' + idx,
                canCreateDisplay: r.canCreate ? '✓' : '✗',
                canReadDisplay: r.canRead ? '✓' : '✗',
                canEditDisplay: r.canEdit ? '✓' : '✗',
                canDeleteDisplay: r.canDelete ? '✓' : '✗',
                viewAllDisplay: r.viewAll ? '✓' : '✗',
                modifyAllDisplay: r.modifyAll ? '✓' : '✗',
                createClass: r.canCreate ? 'slds-text-color_success' : 'slds-text-color_error',
                readClass: r.canRead ? 'slds-text-color_success' : 'slds-text-color_error',
                editClass: r.canEdit ? 'slds-text-color_success' : 'slds-text-color_error',
                deleteClass: r.canDelete ? 'slds-text-color_success' : 'slds-text-color_error',
                modifyClass: r.modifyAll ? 'slds-text-color_error' : ''
            }));
            this.isLoadingObj = false;
        })
        .catch(error => {
            console.error(error);
            this.isLoadingObj = false;
            this.showStatus('Error: ' + this.getErrorMessage(error));
        });
    }

    handleClearObjectPerms() {
        this.objFilter = 'all';
        this.objProfileFilter = 'all';
        this.objPermSetFilter = 'all';
        this.crudFilter = 'all';
        this.objectPermData = null;
        this.objectPermRows = [];
    }

    // Profiles
    handleAnalyzeProfiles() {
        this.isLoadingProfiles = true;
        this.profileData = null;
        this.profileRows = [];

        analyzeProfiles({ profileName: this.profileFilter })
        .then(data => {
            this.profileData = data;
            let rows = data.rows || [];
            this.profileRows = rows.map((r, idx) => ({
                ...r,
                id: 'prof-' + idx,
                statusClass: r.status === 'Used' ? 'slds-text-color_success' : 'slds-text-color_error'
            }));
            this.isLoadingProfiles = false;
        })
        .catch(error => {
            console.error(error);
            this.isLoadingProfiles = false;
            this.showStatus('Error: ' + this.getErrorMessage(error));
        });
    }

    handleClearProfiles() {
        this.profileFilter = 'all';
        this.profileData = null;
        this.profileRows = [];
    }

    // Permission Sets
    handleAnalyzePermSets() {
        this.isLoadingPS = true;
        this.permSetData = null;
        this.permSetRows = [];

        analyzePermSets({ permSetName: this.psFilter })
        .then(data => {
            this.permSetData = data;
            let rows = data.rows || [];
            this.permSetRows = rows.map((r, idx) => ({
                ...r,
                id: 'ps-' + idx,
                statusClass: r.status === 'Used' ? 'slds-text-color_success' : 'slds-text-color_error'
            }));
            this.isLoadingPS = false;
        })
        .catch(error => {
            console.error(error);
            this.isLoadingPS = false;
            this.showStatus('Error: ' + this.getErrorMessage(error));
        });
    }

    handleClearPermSets() {
        this.psFilter = 'all';
        this.permSetData = null;
        this.permSetRows = [];
    }

    // PSGs
    handleAnalyzePSGs() {
        this.isLoadingPSG = true;
        this.psgData = null;
        this.psgRows = [];

        analyzePSGs({ psgName: this.psgFilter })
        .then(data => {
            this.psgData = data;
            let rows = data.rows || [];
            this.psgRows = rows.map((r, idx) => ({
                ...r,
                id: 'psg-' + idx,
                statusClass: r.usageStatus === 'Used' ? 'slds-text-color_success' : 'slds-text-color_error'
            }));
            this.isLoadingPSG = false;
        })
        .catch(error => {
            console.error(error);
            this.isLoadingPSG = false;
            this.showStatus('Error: ' + this.getErrorMessage(error));
        });
    }

    handleClearPSGs() {
        this.psgFilter = 'all';
        this.psgData = null;
        this.psgRows = [];
    }

    // Users
    handleAnalyzeUsers() {
        this.isLoadingUsers = true;
        this.userData = null;
        this.userRows = [];

        analyzeUsers({
            profileName: this.userProfileFilter,
            userName: this.userNameFilter || 'all'
        })
        .then(data => {
            this.userData = data;
            let rows = data.rows || [];
            this.userRows = rows.map((r, idx) => ({
                ...r,
                id: 'user-' + idx,
                isActiveDisplay: r.isActive ? 'Active' : 'Inactive',
                activeClass: r.isActive ? 'slds-text-color_success' : 'slds-text-color_error'
            }));
            this.isLoadingUsers = false;
        })
        .catch(error => {
            console.error(error);
            this.isLoadingUsers = false;
            this.showStatus('Error: ' + this.getErrorMessage(error));
        });
    }

    handleClearUsers() {
        this.userProfileFilter = 'all';
        this.userNameFilter = '';
        this.userData = null;
        this.userRows = [];
    }

    // Download handlers
    handleDownloadObjectPerms() { this.downloadCSV('objectPerms', this.objectPermRows, 'Object_Permissions'); }
    handleDownloadProfiles() { this.downloadCSV('profiles', this.profileRows, 'Profile_Analysis'); }
    handleDownloadPermSets() { this.downloadCSV('permSets', this.permSetRows, 'PermSet_Analysis'); }
    handleDownloadPSGs() { this.downloadCSV('psgs', this.psgRows, 'PSG_Analysis'); }
    handleDownloadUsers() { this.downloadCSV('users', this.userRows, 'User_Analysis'); }

    downloadCSV(type, rows, fileName) {
        if (!rows || rows.length === 0) return;

        let csvContent = '';
        let headers = Object.keys(rows[0]).filter(k =>
            !k.startsWith('id') && !k.endsWith('Class') && !k.endsWith('Display')
            && k !== 'id'
        );
        csvContent += headers.join(',') + '\n';

        rows.forEach(row => {
            let values = headers.map(h => {
                let val = row[h] != null ? String(row[h]) : '';
                val = val.replace(/"/g, '""');
                return '"' + val + '"';
            });
            csvContent += values.join(',') + '\n';
        });

        generateCSV({
            analysisType: type,
            jsonData: csvContent,
            fileName: fileName
        })
        .then(docId => {
            this.showStatus('File saved! Go to Files tab to download: ' + fileName + '.csv');
        })
        .catch(error => {
            console.error(error);
            // Fallback: browser download
            this.browserDownload(csvContent, fileName);
        });
    }

    browserDownload(csvContent, fileName) {
        let blob = new Blob([csvContent], { type: 'text/csv' });
        let link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName + '.csv';
        link.click();
        this.showStatus('Downloaded: ' + fileName + '.csv');
    }

    // Sort handlers
    handleObjSort(event) {
        this.objSortedBy = event.detail.fieldName;
        this.objSortedDirection = event.detail.sortDirection;
        this.objectPermRows = this.sortData(this.objectPermRows, this.objSortedBy, this.objSortedDirection);
    }

    handleProfSort(event) {
        this.profSortedBy = event.detail.fieldName;
        this.profSortedDirection = event.detail.sortDirection;
        this.profileRows = this.sortData(this.profileRows, this.profSortedBy, this.profSortedDirection);
    }

    handlePSSort(event) {
        this.psSortedBy = event.detail.fieldName;
        this.psSortedDirection = event.detail.sortDirection;
        this.permSetRows = this.sortData(this.permSetRows, this.psSortedBy, this.psSortedDirection);
    }

    handlePSGSort(event) {
        this.psgSortedBy = event.detail.fieldName;
        this.psgSortedDirection = event.detail.sortDirection;
        this.psgRows = this.sortData(this.psgRows, this.psgSortedBy, this.psgSortedDirection);
    }

    handleUserSort(event) {
        this.userSortedBy = event.detail.fieldName;
        this.userSortedDirection = event.detail.sortDirection;
        this.userRows = this.sortData(this.userRows, this.userSortedBy, this.userSortedDirection);
    }

    sortData(data, fieldName, direction) {
        let parseData = JSON.parse(JSON.stringify(data));
        let isReverse = direction === 'asc' ? 1 : -1;
        parseData.sort((a, b) => {
            let valA = a[fieldName] || '';
            let valB = b[fieldName] || '';
            if (typeof valA === 'number') return isReverse * (valA - valB);
            return isReverse * String(valA).localeCompare(String(valB));
        });
        return parseData;
    }

    showStatus(msg) {
        this.statusMessage = msg;
        setTimeout(() => { this.statusMessage = ''; }, 3000);
    }

    getErrorMessage(error) {
        if (error?.body?.message) return error.body.message;
        if (error?.message) return error.message;
        return JSON.stringify(error);
    }
}