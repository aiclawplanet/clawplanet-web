import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { EarthBackground } from './components/EarthBackground';
import { Home } from './pages/Home';
import { ToolDetail } from './pages/ToolDetail';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { Profile } from './pages/Profile';
import { DeveloperJoin } from './pages/DeveloperJoin';
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import { CommunityPage } from './pages/CommunityPage';
import { PromoterCenter } from './pages/PromoterCenter';
import { PromoterStats } from './pages/PromoterStats';
import { AdminDashboard } from './pages/AdminDashboard';
import { DeveloperProfile } from './pages/DeveloperProfile';
import { PromoteTool } from './pages/PromoteTool';
import { PromotionCenter } from './pages/PromotionCenter';
import { CreatePromotion } from './pages/CreatePromotion';
import { PromotionList } from './pages/PromotionList';
import { PromotionDetail } from './pages/PromotionDetail';
import { PlatformSettings } from './pages/PlatformSettings';
import { PromoterJoin } from './pages/PromoterJoin';
import { PromoterList } from './pages/PromoterList';
import { ToolManagement } from './pages/ToolManagement';
import { DemandHall } from './pages/DemandHall';
import { DemandDetail } from './pages/DemandDetail';
import { MyDemands } from './pages/MyDemands';
import { DeveloperDemandHall } from './pages/DeveloperDemandHall';
import { MyQuotes } from './pages/MyQuotes';
import { DemandPublish } from './pages/DemandPublish';
import { ChatPage } from './pages/ChatPage';
import { ChatList } from './pages/ChatList';
import { DemandBoost } from './pages/DemandBoost';
import { DeveloperReputation } from './pages/DeveloperReputation';
import { PromoterDemandList } from './pages/PromoterDemandList';
import { MyTools } from './pages/MyTools';
import { ToolEdit } from './pages/ToolEdit';

function App() {
  return (
    <HashRouter>
        <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tool/:id" element={<ToolDetail />} />
          <Route path="category/:id" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="join" element={<DeveloperJoin />} />
          <Route path="dashboard" element={<DeveloperDashboard />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="promoter" element={<PromoterCenter />} />
          <Route path="promoter/stats" element={<PromoterStats />} />
          <Route path="promoter/join" element={<PromoterJoin />} />
          <Route path="promoters" element={<PromoterList />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="developer/:id" element={<DeveloperProfile />} />
          <Route path="promote" element={<PromoteTool />} />
          <Route path="promotion" element={<PromotionCenter />} />
          <Route path="promotion/create" element={<CreatePromotion />} />
          <Route path="promotion/list" element={<PromotionList />} />
          <Route path="promotion/:id" element={<PromotionDetail />} />
          <Route path="promotion/settings" element={<PlatformSettings />} />
          <Route path="tool/:id/manage" element={<ToolManagement />} />
          <Route path="demands" element={<DemandHall />} />
          <Route path="demand/publish" element={<DemandPublish />} />
          <Route path="demand/:id" element={<DemandDetail />} />
          <Route path="my-demands" element={<MyDemands />} />
          <Route path="developer/demands" element={<DeveloperDemandHall />} />
          <Route path="my-quotes" element={<MyQuotes />} />
          <Route path="chat" element={<ChatList />} />
          <Route path="chat/:conversationId" element={<ChatPage />} />
          <Route path="demand/boost/:demandId" element={<DemandBoost />} />
          <Route path="developer/:id/reputation" element={<DeveloperReputation />} />
          <Route path="promoter/demands" element={<PromoterDemandList />} />
          <Route path="my-tools" element={<MyTools />} />
          <Route path="tool/:id/edit" element={<ToolEdit />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
