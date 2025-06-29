const RankIcon = ({ tier, className = "" }) => {
  const iconMap = {
    IRON: '/icons/ranked-emblems/Emblem_Iron.png',
    BRONZE: '/icons/ranked-emblems/Emblem_Bronze.png',
    SILVER: '/icons/ranked-emblems/Emblem_Silver.png',
    GOLD: '/icons/ranked-emblems/Emblem_Gold.png',
    PLATINUM: '/icons/ranked-emblems/Emblem_Platinum.png',
    EMERALD: '/icons/ranked-emblems/Emblem_Emerald.png',
    DIAMOND: '/icons/ranked-emblems/Emblem_Diamond.png',
    MASTER: '/icons/ranked-emblems/Emblem_Master.png',
    GRANDMASTER: '/icons/ranked-emblems/Emblem_Grandmaster.png',
    CHALLENGER: '/icons/ranked-emblems/Emblem_Challenger.png',
    UNRANKED: '/icons/ranked-emblems/Emblem_Unranked.png'
  };

  return (
    <img 
      src={iconMap[tier?.toUpperCase()] || iconMap.UNRANKED} 
      alt={`${tier} rank`} 
      className={`w-6 h-6 ${className}`}
    />
  );
};

export default RankIcon;